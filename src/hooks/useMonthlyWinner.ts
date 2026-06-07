import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useUserMetadata } from './useUserMetadata'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

export function useCheckAndProclaimWinner() {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user) return

      // Déterminer le mois précédent à clôturer (ex: si on est en juin, on évalue mai '05-2026')
      const prevMonthDate = subMonths(new Date(), 1)
      const prevMonthYear = format(prevMonthDate, 'MM-yyyy')

      // A. Vérifier si un vainqueur a déjà été proclamé pour ce mois
      const { data: existing, error: fetchErr } = await supabase
        .from('monthly_winners')
        .select('*')
        .eq('month_year', prevMonthYear)
        .maybeSingle()

      if (fetchErr) throw fetchErr
      if (existing) return; // Déjà proclamé, on s'arrête

      // B. Récupérer le classement général complet des jetons
      const { data: generalList, error: genErr } = await supabase
        .from('loyalty_points')
        .select('user_id, display_name, points')
        .order('points', { ascending: false })

      if (genErr) throw genErr

      // C. Récupérer toutes les victoires des Teams du mois précédent
      const { data: teamStatsList, error: teamErr } = await supabase
        .from('team_stats')
        .select('user_id, team_id, victories')
        .eq('month_year', prevMonthYear)
        .order('victories', { ascending: false })

      if (teamErr) throw teamErr

      if (!generalList || generalList.length === 0) return;

      // D. Formule : Trouver le joueur dont la somme des deux classements est la plus basse
      let bestWinnerId = '';
      let bestWinnerName = '';
      let lowestScore = 999999;

      generalList.forEach((userRow, genIndex) => {
        const genRank = genIndex + 1; // Position générale (1-indexed)

        // Récupérer les stats de ce joueur dans ses Teams
        const userTeamStats = teamStatsList?.filter(s => s.user_id === userRow.user_id) || [];
        
        if (userTeamStats.length > 0) {
          userTeamStats.forEach(stat => {
            // Calculer sa position au sein de cette Team spécifique
            const teamSiblings = teamStatsList?.filter(s => s.team_id === stat.team_id) || [];
            const teamRank = teamSiblings.findIndex(s => s.user_id === userRow.user_id) + 1;

            const score = genRank + teamRank;

            // Garder la somme la plus petite possible
            if (score < lowestScore) {
              lowestScore = score;
              bestWinnerId = userRow.user_id;
              bestWinnerName = userRow.display_name;
            }
          });
        }
      });

      // E. Si un gagnant est trouvé, enregistrer et proclamer
      if (bestWinnerId) {
        // Enregistrer en base de données
        const { error: winErr } = await supabase
          .from('monthly_winners')
          .insert([{
            month_year: prevMonthYear,
            user_id: bestWinnerId,
            score: lowestScore
          }]);

        if (winErr) throw winErr;

        // Publier l'article de victoire sur la page Actualités
        const monthName = format(prevMonthDate, 'MMMM yyyy', { locale: fr });
        
        await supabase
          .from('news')
          .insert([{
            title: `👑 JOUEUR DU MOIS : FÉLICITATIONS À @${bestWinnerName} !`,
            excerpt: `En ce 1er du mois, nous proclamons officiellement @${bestWinnerName} comme le JOUEUR DU MOIS de ${monthName} ! Grâce à sa régularité exemplaire (somme des positions la plus faible dans sa Team et au général), il remporte le prestige du Sanctuary et les privilèges de caisse associés !`,
            category: 'Global',
            image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600'
          }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
    }
  })
}
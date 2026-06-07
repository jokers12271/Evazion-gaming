import { useState, useEffect } from 'react'

/**
 * Calcule le temps restant entre maintenant et une date de fin
 * Retourne un objet avec minutes, secondes et un format texte MM:SS
 */
export function useLiveTimer(endTime: string | null, isStarted: boolean) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    // Si la session n'est pas démarrée ou pas de date de fin, on ne fait rien
    if (!isStarted || !endTime) {
      setTimeLeft(0)
      return
    }

    const calculate = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime()
      const secondsRemaining = Math.max(0, Math.floor(difference / 1000))
      setTimeLeft(secondsRemaining)
    };

    // Calcul initial
    calculate()

    // Mise à jour chaque seconde
    const timer = setInterval(calculate, 1000)

    return () => clearInterval(timer)
  }, [endTime, isStarted])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return {
    totalSeconds: timeLeft,
    minutes,
    seconds,
    display: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
    isOver: timeLeft === 0 && isStarted
  }
}
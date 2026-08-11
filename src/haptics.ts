/**
 * Haptics wrapper. Uses Capacitor Haptics on native; falls back to the web
 * Vibration API in the browser. Never throws, never blocks.
 */
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const native = Capacitor.isNativePlatform()

export function tapLight(): void {
  if (native) {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  } else {
    navigator.vibrate?.(8)
  }
}

export function tapMedium(): void {
  if (native) {
    void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
  } else {
    navigator.vibrate?.(15)
  }
}

export function notifyWin(): void {
  if (native) {
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {})
  } else {
    navigator.vibrate?.([20, 40, 20])
  }
}

export function notifyLose(): void {
  if (native) {
    void Haptics.notification({ type: NotificationType.Warning }).catch(() => {})
  } else {
    navigator.vibrate?.(40)
  }
}

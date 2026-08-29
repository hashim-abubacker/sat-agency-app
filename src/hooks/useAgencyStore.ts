import { useSyncExternalStore } from 'react'
import { agencyStore } from '@/services/store'

export function useAgencyStore() {
  const state = useSyncExternalStore(
    (listener) => agencyStore.subscribe(listener),
    () => agencyStore.getState(),
    () => agencyStore.getState()
  )

  return {
    state,
    store: agencyStore,
  }
}

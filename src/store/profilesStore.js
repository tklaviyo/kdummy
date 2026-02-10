/**
 * Profiles store for event assignment.
 * Persisted to localStorage. No backend.
 * Profile shape: { id, email, firstName, lastName, country }
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'kdummy-profiles'
const DEFAULT_COUNTRIES = ['US', 'UK', 'CA']

function makeProfileId() {
  return `prof_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Generate N profiles with safe fake emails (user_<id>@example.invalid).
 * Adds them to the store and returns the new list.
 * @param {number} count - Number of profiles to generate
 * @param {string[]} [countries] - Country codes to assign (round-robin). Defaults to DEFAULT_COUNTRIES.
 * @returns {Array<{ id, email, firstName, lastName, country }>}
 */
function generateProfilesImpl(count, countries = DEFAULT_COUNTRIES) {
  const list = []
  const countryList = Array.isArray(countries) && countries.length > 0 ? countries : DEFAULT_COUNTRIES
  for (let i = 0; i < count; i++) {
    const id = makeProfileId()
    list.push({
      id,
      email: `user_${id}@example.invalid`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      country: countryList[i % countryList.length],
    })
  }
  return list
}

export const useProfilesStore = create(
  persist(
    (set, get) => ({
      profiles: [],

      /**
       * Load all profiles (for reading). Same as getState().profiles.
       */
      getProfiles() {
        return get().profiles
      },

      /**
       * Set the full profiles list (replace).
       */
      setProfiles(profiles) {
        set({ profiles: Array.isArray(profiles) ? profiles : [] })
      },

      /**
       * Add one or more profiles.
       */
      addProfiles(newProfiles) {
        const list = Array.isArray(newProfiles) ? newProfiles : [newProfiles]
        set((state) => ({ profiles: [...state.profiles, ...list] }))
      },

      /**
       * Generate N profiles with safe fake emails and add them to the store.
       * Returns the newly created profiles for use in event generation.
       * @param {number} count
       * @param {string[]} [countries]
       * @returns {Array<{ id, email, firstName, lastName, country }>}
       */
      generateAndAddProfiles(count, countries) {
        const n = Math.max(1, Math.min(500, Number(count) || 5))
        const newProfiles = generateProfilesImpl(n, countries)
        set((state) => ({ profiles: [...state.profiles, ...newProfiles] }))
        return newProfiles
      },

      /**
       * Remove a profile by id.
       */
      removeProfile(id) {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
        }))
      },

      /**
       * Clear all profiles.
       */
      clearProfiles() {
        set({ profiles: [] })
      },
    }),
    { name: STORAGE_KEY }
  )
)

/**
 * Generate N profiles without adding to store (e.g. for one-off event run).
 * Use when profileSelection.mode='generate' and you want in-memory-only profiles for this run.
 * @param {number} count
 * @param {string[]} [countries]
 * @returns {Array<{ id, email, firstName, lastName, country }>}
 */
export function generateProfiles(count, countries) {
  const n = Math.max(1, Math.min(500, Number(count) || 5))
  return generateProfilesImpl(n, countries)
}

export { DEFAULT_COUNTRIES }

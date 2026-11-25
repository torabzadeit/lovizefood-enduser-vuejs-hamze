// Same approved menu behavior, with independent state and no ordinary checkout intent.
import { state as basketState, mutations as basketMutations } from './basket';
export { getters, actions } from './basket';
export const namespaced = true;
export const state = basketState;
export const mutations = {
  ...basketMutations,
  reset(current) { Object.assign(current, basketState()); },
};

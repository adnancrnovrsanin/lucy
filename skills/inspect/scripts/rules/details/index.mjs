import FIX_BY from './fix-by.mjs';
import states from './states.mjs';
import editing from './editing.mjs';

export default [...states, ...editing].map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

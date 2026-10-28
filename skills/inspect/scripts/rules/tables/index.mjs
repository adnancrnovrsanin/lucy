import engine from './engine.mjs';
import FIX_BY from './fix-by.mjs';

export default [...engine]
  .map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

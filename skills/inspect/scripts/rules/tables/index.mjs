import engine from './engine.mjs';
import semantics from './semantics.mjs';
import FIX_BY from './fix-by.mjs';

export default [...engine, ...semantics]
  .map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

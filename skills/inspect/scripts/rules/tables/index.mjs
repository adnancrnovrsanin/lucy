import engine from './engine.mjs';
import semantics from './semantics.mjs';
import cells from './cells.mjs';
import behaviour from './behaviour.mjs';
import states from './states.mjs';
import data from './data.mjs';
import FIX_BY from './fix-by.mjs';

export default [...engine, ...semantics, ...cells, ...behaviour, ...states, ...data]
  .map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

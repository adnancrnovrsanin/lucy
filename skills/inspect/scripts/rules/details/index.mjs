import FIX_BY from './fix-by.mjs';
import states from './states.mjs';
import semantics from './semantics.mjs';
import data from './data.mjs';
import routing from './routing.mjs';
import navigation from './navigation.mjs';
import editing from './editing.mjs';

export default [...states, ...semantics, ...data, ...routing, ...navigation, ...editing].map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

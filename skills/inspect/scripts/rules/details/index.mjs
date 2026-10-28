import FIX_BY from './fix-by.mjs';

export default [].map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

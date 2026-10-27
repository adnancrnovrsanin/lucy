import controls from './controls.mjs';
import labels from './labels.mjs';
import autofill from './autofill.mjs';
import schema from './schema.mjs';
import feedback from './feedback.mjs';
import keyboard from './keyboard.mjs';
import stacks from './stacks.mjs';
import FIX_BY from './fix-by.mjs';

export default [...controls, ...labels, ...autofill, ...schema, ...feedback, ...keyboard, ...stacks]
  .map((rule) => ({ ...rule, fixBy: FIX_BY[rule.id] }));

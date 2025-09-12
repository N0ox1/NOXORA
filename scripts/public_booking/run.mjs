import t1 from './availability.mjs';
import t2 from './overlap.mjs';
import t3 from './hold.mjs';
import t4 from './cancel_rules.mjs';
import t5 from './indexes.mjs';
(async () => { try { for (const t of [t1, t2, t3, t4, t5]) { const m = await t(); console.log('✅', m); } console.log('🎯 Booking Público ok'); } catch (e) { console.error(e); process.exit(1); } })();



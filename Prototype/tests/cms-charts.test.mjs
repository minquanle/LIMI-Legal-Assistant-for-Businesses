import test from 'node:test';
import assert from 'node:assert/strict';
import {donut,dailyColumns,miniRing,renderAnalytics,chartColors as c} from '../dist/cms-charts.js';
const days=Array.from({length:14},(_,i)=>({date:`2026-10-${String(13+i).padStart(2,'0')}`,expert:i===0?4:0,auto:i===13?2:0,count:1,received:0,replies:0,law:0,reminder:0}));
const o={obligations:{groups:[{group:'tax',draft:2,inReview:1,published:4,retired:0}],reviewBasis:{expert:3,auto:1},deadlineKinds:{periodic:2,once:1,review:1,none:0},approvalsPerDay:days},changes:{pending:2,approved:1,rejected:0,stages:{NEW:2},byKind:{NEW_DOCUMENT:2},perDay:days},feedback:{},feedbackInsights:{byCategory:{},perDay:days},alerts:{alerts30:0,reminders30:0,held30:2,perDay:days},sources:{watchTotal:475,watchEnabled:0,observations24h:{total:0,failed:0}}};
test('donuts preserve counts, escape labels and have honest zero states',()=>{
 const html=donut([{label:'<img>',value:3,color:c.teal},{label:'B',value:1,color:c.navy}]);
 assert.ok(html.includes('75%')&&html.includes('25%')&&html.includes('&lt;img&gt;'));assert.ok(!html.includes('<img>'));
 const zero=donut([{label:'A',value:0,color:c.teal}]);assert.ok(zero.includes('cms-chart-empty'));assert.ok(!zero.includes('NaN')&&!zero.includes('Infinity')&&!zero.includes('cms-donut-total'));
 assert.ok(miniRing(0,0,'Không dữ liệu').includes('—'));
});
test('daily count axes use integers and keep exact dates accessible',()=>{
 const html=dailyColumns(days,[{key:'expert',label:'Đã duyệt',color:c.teal}]);assert.ok(html.includes('2026-10-13')&&html.includes('2026-10-26'));assert.ok(html.includes('Ngày (Việt Nam)'));assert.ok(!html.includes('>0,5<'));
 const zero=dailyColumns(days,[{key:'law',label:'Luật',color:c.teal}]);assert.ok(zero.includes('cms-chart-empty'));assert.ok(!zero.includes('<rect'));
});
test('four chart groups keep scope and range distinct',()=>{
 for(const [tab,count] of [['checklists',5],['changes',4],['feedback',3],['delivery',4]]){const html=renderAnalytics(o,tab,7);assert.equal((html.match(/<section class="cms-chart-panel/g)||[]).length,count);assert.ok(html.includes('7 ngày gần nhất'));assert.ok(!html.includes('NaN')&&!html.includes('undefined'));}
 const checks=renderAnalytics(o,'checklists',7);assert.ok(checks.includes('data-filter="all"'));assert.ok(checks.includes('nghĩa vụ: 7'));assert.ok(!checks.includes('2026-10-13'));
 const delivery=renderAnalytics(o,'delivery',7);assert.ok(delivery.includes('30 ngày gần nhất'));assert.ok(delivery.includes('475'));assert.ok(delivery.includes('2 thông báo đang giữ'));
});

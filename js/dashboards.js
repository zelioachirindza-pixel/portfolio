/* Demonstrações locais: todas as entidades e valores são fictícios. */
(function () {
  'use strict';
  var stage = document.getElementById('gstage'), tabs = document.getElementById('gtabs');
  if (!stage || !tabs) return;
  var months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov'];
  var regions = ['Sul','Centro','Norte'];
  var state = { id: 'divida', region: 'Todas', period: 'ytd', theme: 'light' };
  function nf(n,d) { return n.toLocaleString('pt-PT',{minimumFractionDigits:d == null ? 1:d,maximumFractionDigits:d == null ? 1:d}).replace(/\u00a0|\u202f/g,' '); }
  function sum(a,k) { return a.reduce(function(n,r){return n+r[k];},0); }
  function pct(a,b) { return b ? (a/b-1)*100 : 0; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  var seed=171126;
  function random() { seed=seed*16807%2147483647; return (seed-1)/2147483646; }
  var records=[], inventory=[];
  regions.forEach(function(region,ri){
    months.forEach(function(m,mi){
      var py=Math.round((18+random()*11+mi*.8)*(1-ri*.16)*10)/10;
      var sales=Math.round(py*(.91+random()*.3)*10)/10;
      records.push({region:region,m:m,month:mi,py:py,sales:sales,receipts:sales*(.87+random()*.1),receiptsPy:py*.91,payments:sales*(.78+random()*.13),km:22000+Math.round(random()*17000),cost:.8+random()*.6,litres:7000+Math.round(random()*3000)});
    });
    ['Mercearia','Bebidas','Higiene','Limpeza','Frescos','Outros'].forEach(function(k){
      var v=3+random()*11;
      inventory.push({region:region,k:k,value:v,daily:v/(24+random()*90),aged:v*(.05+random()*.3)});
    });
  });
  records.forEach(function(r){r.costPy=r.cost*r.py/r.sales*1.05;});
  function selected() { return records.filter(function(r){return (state.region==='Todas'||r.region===state.region)&&(state.period==='ytd'||r.month===10);}); }
  function activeRegions() { return regions.filter(function(r){return state.region==='Todas'||r===state.region;}); }
  function monthly(rows,cur,py) { return months.map(function(m,i){var a=rows.filter(function(r){return r.month===i;});return {m:m,cur:sum(a,cur),py:sum(a,py)};}).filter(function(r){return r.cur||r.py;}); }
  function delta(n) { return '<span class="'+(n>=0?'pos':'neg')+'">'+(n>=0?'▲ ':'▼ ')+nf(Math.abs(n))+'% vs AA</span>'; }
  function tile(k,v,u,d) { return '<div class="tile"><div class="tile__k">'+k+'</div><div class="tile__v">'+v+'<span class="tile__u">'+u+'</span></div><div class="tile__d">'+d+'</div></div>'; }
  function svg(w,h,label,body,desc) { return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title><desc>'+esc(desc)+'</desc>'+body+'</svg>'; }
  function groupedBars(data,label,lowerIsBetter) {
    var W=600,H=220,bottom=185,top=40,max=Math.max.apply(null,data.map(function(d){return Math.max(d.cur,d.py);}))*1.1||1;
    var slot=584/data.length,bw=Math.min(34,slot*.5),s='';
    [0,.5,1].forEach(function(g){var y=bottom-(bottom-top)*g;s+='<line class="viz-grid" x1="8" x2="592" y1="'+y+'" y2="'+y+'"/>';});
    data.forEach(function(d,i){
      var x=8+slot*(i+.5),hp=d.py/max*(bottom-top),hc=d.cur/max*(bottom-top),diff=pct(d.cur,d.py);
      s+='<g><title>'+esc(d.m)+': actual '+nf(d.cur)+'; AA '+nf(d.py)+'; variação '+nf(diff)+'%</title>';
      s+='<rect class="viz-bar" x="'+(x-bw/2)+'" y="'+(bottom-hp)+'" width="'+bw+'" height="'+hp+'"/>';
      s+='<rect class="viz-cur" x="'+(x-bw/4)+'" y="'+(bottom-hc)+'" width="'+bw/2+'" height="'+hc+'"/>';
      s+='<text class="viz-change '+((lowerIsBetter?diff>0:diff<0)?'viz-negative':'')+'" text-anchor="middle" x="'+x+'" y="19">'+(diff>=0?'▲':'▼')+nf(Math.abs(diff),0)+'%</text>';
      s+='<text class="viz-val" text-anchor="middle" x="'+x+'" y="'+(bottom-Math.max(hp,hc)-7)+'">'+nf(d.cur)+'</text>';
      s+='<text class="viz-lbl" text-anchor="middle" x="'+x+'" y="207">'+esc(d.m)+'</text></g>';
    });
    return svg(W,H,label,s,data.map(function(d){return d.m+': actual '+nf(d.cur)+', ano anterior '+nf(d.py);}).join('; '));
  }
  function hBars(data,label,unit,opts) {
    data=data.slice();
    if(!opts||!opts.keepOrder)data.sort(function(a,b){return b.v-a.v;});
    var max=Math.max.apply(null,data.map(function(d){return d.v;}))||1,s='';
    data.forEach(function(d,i){var y=10+i*37;s+='<text class="viz-lbl" x="0" y="'+(y+13)+'">'+esc(d.k)+'</text><rect class="viz-bar '+(d.tone||'')+'" x="135" y="'+y+'" width="'+(d.v/max*280)+'" height="19"/><text class="viz-val" x="490" text-anchor="end" y="'+(y+14)+'">'+nf(d.v)+'</text>';});
    return svg(500,data.length*37+15,label,s,data.map(function(d){return d.k+': '+nf(d.v)+' '+unit;}).join('; '));
  }
  function table(headers,rows) {
    return '<div class="dtable-scroll" role="region" aria-label="Tabela de detalhe" tabindex="0"><table class="dtable"><thead><tr>'+headers.map(function(h,i){return '<th scope="col"'+(i?' class="num"':'')+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c,i){return i?'<td class="num dmono">'+c+'</td>':'<th scope="row">'+c+'</th>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
  }
  function viz(title,unit,content,cols) { return '<section class="viz col-'+(cols||6)+'"><h3 class="viz__h">'+title+'<span>'+unit+'</span></h3>'+content+'</section>'; }
  function legend() { return '<div class="legend"><span><i class="legend-current"></i>Actual</span><span><i class="legend-previous"></i>Ano Anterior</span></div>'; }
  function shell(title,kpis,visuals,snapshot) { return '<div class="dash dash--'+state.theme+'" data-report="'+state.id+'"><div class="dash__bar"><span class="dash__accent" aria-hidden="true"></span><div class="dash__titles"><h3 class="dash__title">'+title+'</h3><p class="dash__sub">'+(snapshot?'Posição em 30 Nov 2026':(state.period==='ytd'?'Jan–Nov 2026':'Nov 2026'))+' · '+state.region+' · valores fictícios</p></div><span class="pill">Demonstração</span></div><div class="dash__grid"><div class="viz--kpis col-12" style="--tiles:'+kpis.length+'">'+kpis.join('')+'</div>'+visuals+'</div></div>'; }
  function dashTesouraria() {
    var rows=selected(),inc=sum(rows,'receipts'),out=sum(rows,'payments'),opening=(state.region==='Todas'?3:1)*9.5;
    if(state.period==='nov') {
      var prior=records.filter(function(r){return (state.region==='Todas'||r.region===state.region)&&r.month<10;});
      opening+=sum(prior,'receipts')-sum(prior,'payments');
    }
    var detail=activeRegions().map(function(region){var a=rows.filter(function(r){return r.region===region;}),x=sum(a,'receipts'),y=sum(a,'payments');return [region,nf(x),nf(y),nf(x-y)];});
    var movements=months.map(function(m,i){var a=rows.filter(function(r){return r.month===i;});return a.length?[m,nf(sum(a,'receipts')),nf(sum(a,'payments')),nf(sum(a,'receipts')-sum(a,'payments'))]:null;}).filter(Boolean);
    return shell('Tesouraria · Posição de caixa',[tile('Saldo de abertura',nf(opening),'M MT','Início do período seleccionado'),tile('Entradas',nf(inc),'M MT','Cobranças do período'),tile('Saídas',nf(out),'M MT','Pagamentos do período'),tile('Saldo de fecho',nf(opening+inc-out),'M MT','Abertura + entradas − saídas')],viz('Cobranças por mês','M MT · actual vs AA',legend()+groupedBars(monthly(rows,'receipts','receiptsPy'),'Cobranças mensais e ano anterior'),7)+viz('Movimentos por região','M MT',table(['Região','Entradas','Saídas','Fluxo líquido'],detail),5)+viz('Entradas e saídas por mês','M MT',table(['Mês','Entradas','Saídas','Fluxo líquido'],movements),12));
  }
function fleetScatter(rows) {
    var data=[];
    activeRegions().forEach(function(region){
      var fleet=vehicles.filter(function(v){return v.region===region;}),r=rows.filter(function(v){return v.region===region;}),km=sum(r,'km'),cost=sum(r,'cost'),weights=fleet.reduce(function(a,v){return a+v.km*v.rate;},0),distance=sum(fleet,'km');
      fleet.forEach(function(v){data.push({k:v.k,type:v.type,km:v.km/distance*km,cost:v.km*v.rate/weights*cost});});
    });
    var maxX=Math.max.apply(null,data.map(function(v){return v.km;}))*1.15,maxY=Math.max.apply(null,data.map(function(v){return v.cost;}))*1.15,s='';
    for(var i=0;i<=4;i++){
      var x=60+i/4*500,y=230-i/4*195;
      s+='<line class="viz-grid" x1="60" x2="560" y1="'+y+'" y2="'+y+'"/><line class="viz-grid" x1="'+x+'" x2="'+x+'" y1="35" y2="230"/><text class="viz-lbl" x="'+x+'" y="252" text-anchor="middle">'+nf(maxX*i/4/1000,0)+' k</text><text class="viz-lbl" x="50" y="'+(y+4)+'" text-anchor="end">'+nf(maxY*i/4,2)+'</text>';
    }
    data.forEach(function(v){s+='<circle class="fleet-point fleet-point--'+v.type+'" cx="'+(60+v.km/maxX*500)+'" cy="'+(230-v.cost/maxY*195)+'" r="7"><title>'+v.k+': '+nf(v.km,0)+' km; '+nf(v.cost,2)+' M MT; '+nf(v.cost*1e6/v.km,2)+' MT/km</title></circle>';});
    s+='<text class="viz-lbl" x="310" y="279" text-anchor="middle">Km percorridos</text>';
    return svg(600,290,'Custo total e quilometragem por viatura',s,'Cada ponto é uma viatura fictícia. Eixo horizontal: quilómetros. Eixo vertical: custo em milhões MT. Os pontos reconciliam com os totais do período.');
  }
  function dashFrota() {
    var rows=selected(),cost=sum(rows,'cost'),km=sum(rows,'km'),litres=sum(rows,'litres');
    var components=[{k:'Combustível',v:cost*.55},{k:'Manutenção',v:cost*.25},{k:'Pneus',v:cost*.09},{k:'Seguros',v:cost*.07},{k:'Outros',v:cost*.04}];
    var detail=activeRegions().map(function(region){var a=rows.filter(function(r){return r.region===region;}),distance=sum(a,'km'),c=sum(a,'cost');return [region,nf(distance,0),nf(c,2),nf(c*1e6/distance,2)];});
    var fleet=inRegion(vehicles);
    return shell('Gastos da Frota — custo e eficiência',[
      tile('Gastos',nf(cost,2),'M MT','Gastos no período seleccionado'),tile('Km percorridos',nf(km,0),'km','Distância acumulada'),
      tile('Custo por km',nf(cost*1e6/km,2),'MT/km','Gastos / km percorridos'),tile('Consumo médio',nf(litres/km*100),'L/100 km','Litros / km × 100'),
      tile('Viaturas com gasto',nf(fleet.length,0),'viaturas','Identificadores fictícios'),tile('Média por viatura',nf(cost*1e6/fleet.length/1000),'mil MT','Gastos / viaturas com gasto')],
      viz('Gastos por mês','M MT · actual vs AA',legend()+groupedBars(monthly(rows,'cost','costPy'),'Gastos da frota e Ano Anterior',true),7)+
      viz('Gastos por natureza','M MT',hBars(components,'Composição dos gastos da frota','M MT'),5)+
      viz('Custo total e quilometragem por viatura','M MT · km','<div class="legend"><span><i class="fleet-key--0"></i>Mercadorias</span><span><i class="fleet-key--1"></i>Ligeiros</span><span><i class="fleet-key--2"></i>Mistos</span></div>'+fleetScatter(rows),7)+
      viz('Eficiência por região','Período seleccionado',table(['Região','Km','Gastos · M MT','MT/km'],detail),5));
  }

  function heatmap(rows) {
    var mm=state.period==='ytd'?months:['Nov'];
    return '<div class="heatmap-scroll"><table class="heatmap"><caption>Variação da facturação por região e mês · % vs AA</caption><thead><tr><th scope="col">Região</th>'+mm.map(function(m){return '<th scope="col">'+m+'</th>';}).join('')+'</tr></thead><tbody>'+activeRegions().map(function(region){return '<tr><th scope="row">'+region+'</th>'+mm.map(function(m){var r=rows.find(function(x){return x.m===m&&x.region===region;}),d=pct(r.sales,r.py);return '<td class="'+(d<0?'heat-negative':'heat-positive')+'" style="--heat:'+(.06+Math.min(Math.abs(d)/35,1)*.16)+'">'+(d>=0?'+':'−')+nf(Math.abs(d),0)+'%</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
  }
  function dashFacturacao() {
    var rows=selected(),cur=sum(rows,'sales'),py=sum(rows,'py'),diff=pct(cur,py);
    return shell('Facturação · Evolução e comparação AA',[tile('Facturação',nf(cur),'M MT',delta(diff)),tile('Ano Anterior',nf(py),'M MT','Mesmo período de 2025'),tile('Variação absoluta',(cur>=py?'+':'−')+nf(Math.abs(cur-py)),'M MT','Actual − Ano Anterior'),tile('Variação relativa',(diff>=0?'+':'−')+nf(Math.abs(diff)),'%','Actual / AA − 1')],viz('Facturação por mês','M MT · actual vs AA',legend()+groupedBars(monthly(rows,'sales','py'),'Facturação mensal e ano anterior'),12)+viz('Variação da facturação por região e mês','% vs AA',heatmap(rows),12));
  }
  function dashDistribuicao() {
    var rows=selected(),sales=sum(rows,'sales'),receipts=sum(rows,'receipts');
    var detail=activeRegions().map(function(region){var a=rows.filter(function(r){return r.region===region;}),s=sum(a,'sales'),c=sum(a,'receipts');return [region,nf(s),nf(c),nf(s-c),nf(c/s*100)+'%'];});
    return shell('Distribuição · Facturação e cobranças',[tile('Facturação',nf(sales),'M MT','Período seleccionado'),tile('Cobranças',nf(receipts),'M MT','Recebimentos no período'),tile('Diferença no período',nf(sales-receipts),'M MT','Facturação − cobranças'),tile('Cobranças / facturação',nf(receipts/sales*100),'%','Rácio de fluxos do período')],viz('Cobranças por região','M MT',hBars(activeRegions().map(function(region){return {k:region,v:sum(rows.filter(function(r){return r.region===region;}),'receipts')};}),'Cobranças por região','M MT'))+viz('Facturação e cobranças por região','M MT',table(['Região','Facturação','Cobranças','Diferença','Rácio'],detail))+'<p class="dash__footnote col-12">O rácio compara fluxos do período. A diferença não representa dívida: esta exige saldo inicial, notas de crédito e imputação dos recebimentos.</p>');
  }
  function dashStock() {
    var rows=inventory.filter(function(r){return state.region==='Todas'||r.region===state.region;}),value=sum(rows,'value'),daily=sum(rows,'daily'),aged=sum(rows,'aged');
    var cats=['Mercearia','Bebidas','Higiene','Limpeza','Frescos','Outros'].map(function(k){var a=rows.filter(function(r){return r.k===k;});return {k:k,value:sum(a,'value'),daily:sum(a,'daily'),aged:sum(a,'aged')};}).sort(function(a,b){return b.value/b.daily-a.value/a.daily;});
    return shell('Stock / SOR · Cobertura e antiguidade',[tile('Valor em stock',nf(value),'M MT','Posição em 30 Nov 2026'),tile('Cobertura · DOH',nf(value/daily),'dias','Stock / saída diária a custo'),tile('Stock com mais de 90 dias',nf(aged),'M MT',nf(aged/value*100)+'% do valor em stock'),tile('Categorias analisadas',nf(cats.length,0),'categorias','Posição por região')],viz('Cobertura por categoria','dias · maior para menor',hBars(cats.map(function(c){return {k:c.k,v:c.value/c.daily};}),'Dias de cobertura de stock por categoria','dias'))+viz('Antiguidade do stock','M MT',hBars([{k:'Até 90 dias',v:value-aged},{k:'Mais de 90 dias',v:aged}],'Valor de stock por antiguidade','M MT'))+viz('Stock por categoria','Posição em 30 Nov 2026',table(['Categoria','Stock · M MT','DOH · dias','>90 dias · M MT'],cats.map(function(c){return [c.k,nf(c.value),nf(c.value/c.daily),nf(c.aged)];})),12),true);
  }
  /* Referências visuais: capturas fornecidas pelo autor em Downloads/trabalhos.
     Nenhum pixel, nome, logótipo ou valor dessas capturas é distribuído no site. */
  var cheques=[],debts=[],vehicles=[];
  regions.forEach(function(region,ri){
    for(var i=0;i<30;i++){
      debts.push({region:region,client:'Cliente '+(ri*30+i+1).toString().padStart(3,'0'),days:Math.round(random()*190)-140,value:.3+random()*5});
    }
    for(var j=0;j<28;j++){
      cheques.push({region:region,bank:'Banco '+String.fromCharCode(65+j%5),days:Math.round((random()-.42)*100),value:.04+Math.pow(random(),3)*1.8});
    }
    for(var k=0;k<12;k++)vehicles.push({region:region,k:'Viatura '+(ri*12+k+1).toString().padStart(3,'0'),km:1800+random()*6500,rate:19+random()*39,type:k%3});
  });
  function inRegion(rows){return rows.filter(function(r){return state.region==='Todas'||r.region===state.region;});}
  function warning(v){return '<span class="report-warning">'+v+'</span>';}
  function danger(v){return '<span class="report-danger">'+v+'</span>';}
  function notes(items){return '<div class="report-notes col-12">'+items.map(function(t){return '<span>'+t+'</span>';}).join('')+'</div>';}
  function maturityBars(rows){
    var groups=[{k:'Por vencer',test:function(d){return d.days>=0;}},{k:'Vencida 1–30 dias',test:function(d){return d.days<0&&d.days>=-30;}},{k:'Vencida 31–90 dias',test:function(d){return d.days< -30&&d.days>=-90;}},{k:'Vencida >90 dias',test:function(d){return d.days< -90;}}];
    var data=groups.map(function(g,i){return {k:g.k,v:sum(rows.filter(g.test),'value'),tone:i===0?'viz-current':i===3?'viz-risk':'viz-amber'};});
    return hBars(data,'Composição da dívida por vencimento','M MT',{keepOrder:true});
  }
  function dashDivida(){
    var rows=inRegion(debts),total=sum(rows,'value'),overdue=sum(rows.filter(function(r){return r.days<0;}),'value'),old=sum(rows.filter(function(r){return r.days< -90;}),'value');
    var top=rows.slice().sort(function(a,b){return b.value-a.value;}).slice(0,6);
    return shell('Dívida — posição, vencimento e concentração',[
      tile('Dívida por documento',nf(total),'M MT','Posição de documentos em aberto'),
      tile('Dívida vencida',warning(nf(overdue)),'M MT','Vencimento já ultrapassado'),
      tile('Percentagem vencida',warning(nf(overdue/total*100)),'%','Dívida vencida / dívida total'),
      tile('Vencida há mais de 90 dias',danger(nf(old)),'M MT','Prioridade de cobrança'),
      tile('Clientes devedores',nf(rows.length,0),'clientes','Entidades fictícias distintas')],
      notes(['<b>Por vencer</b> '+nf(total-overdue)+' M MT','<b>Maior devedor</b> '+nf(top[0].value)+' M MT','<b>Top 6</b> '+nf(sum(top,'value')/total*100)+'% da dívida'])+
      viz('Devedores com maior saldo','M MT',table(['Cliente','Dívida','Estado'],top.map(function(r){return [r.client,nf(r.value),r.days<0?warning('Vencida'): 'No prazo'];})),5)+
      viz('Composição da dívida por vencimento','M MT',maturityBars(rows),7)+
      viz('Dívida por região','M MT',hBars(activeRegions().map(function(region){return {k:region,v:sum(rows.filter(function(r){return r.region===region;}),'value')};}),'Dívida por região','M MT'),6)+
      viz('Concentração por escalão de dívida','M MT',hBars([{k:'Até 1 M MT',v:sum(rows.filter(function(r){return r.value<=1;}),'value')},{k:'1 a 3 M MT',v:sum(rows.filter(function(r){return r.value>1&&r.value<=3;}),'value')},{k:'Mais de 3 M MT',v:sum(rows.filter(function(r){return r.value>3;}),'value')}],'Concentração da dívida por escalão','M MT'),6),true);
  }
  function chequeSwarm(rows){
    var w=1000,h=300,left=35,right=965,mid=145,min=-60,max=90,placed=[],s='';
    function x(days){return left+(days-min)/(max-min)*(right-left);}
    var zero=x(0);
    s+='<rect class="swarm-late-bg" x="'+left+'" y="28" width="'+(zero-left)+'" height="230"/><line class="swarm-axis" x1="'+zero+'" x2="'+zero+'" y1="24" y2="258" stroke-dasharray="4 4"/><text class="viz-lbl" x="'+zero+'" y="15" text-anchor="middle">30 Nov 2026</text>';
    rows.slice().sort(function(a,b){return b.value-a.value;}).forEach(function(r){
      var cx=x(r.days),radius=Math.sqrt(r.value)*10,cy=mid;
      for(var a=0;a<120;a++){
        cy=mid+(a%2?1:-1)*Math.ceil(a/2)*3.5;
        if(placed.every(function(p){return Math.hypot(cx-p.x,cy-p.y)>radius+p.r+2;}))break;
      }
      placed.push({x:cx,y:cy,r:radius});
      s+='<circle class="'+(r.days<0?'swarm-late':r.days<=7?'swarm-soon':'swarm-future')+'" cx="'+cx+'" cy="'+cy+'" r="'+radius+'"><title>'+r.bank+' · '+r.region+' · '+nf(r.value,2)+' M MT · '+(r.days<0?'vencido há '+(-r.days):'vence em '+r.days)+' dias</title></circle>';
    });
    [-60,-30,-7,0,7,30,60,90].forEach(function(d){s+='<text class="viz-lbl" x="'+x(d)+'" y="281" text-anchor="middle">'+(d>0?'+':'')+d+'</text>';});
    return svg(w,h,'Cheques em aberto por dias até ao vencimento',s,'Cada ponto é um cheque fictício. Área proporcional ao valor. Vencidos à esquerda de zero; vencimentos futuros à direita. '+rows.length+' cheques; '+nf(sum(rows,'value'))+' M MT.');
  }
  function dashCheques(){
    var rows=inRegion(cheques),total=sum(rows,'value'),late=rows.filter(function(r){return r.days<0;}),week=rows.filter(function(r){return r.days>=0&&r.days<=7;}),month=rows.filter(function(r){return r.days>=0&&r.days<=30;});
    return shell('Cheques Pré-datados — carteira e vencimentos',[
      tile('Em carteira',nf(total),'M MT',rows.length+' cheques por depositar'),
      tile('Vence em 7 dias',warning(nf(sum(week,'value'))),'M MT',week.length+' cheques · de 0 a 7 dias'),
      tile('Vence em 30 dias',warning(nf(sum(month,'value'))),'M MT','Inclui a janela de 7 dias'),
      tile('Vencidos por depositar',danger(nf(sum(late,'value'))),'M MT',late.length+' cheques fora de prazo')],
      viz('Cheques em aberto por dias até ao vencimento','Área = valor · MT','<div class="legend"><span><i class="legend-late"></i>Vencidos</span><span><i class="legend-soon"></i>Vence em 7 dias</span><span><i class="legend-future"></i>No prazo</span></div>'+chequeSwarm(rows),12)+
      viz('Cheques em carteira por banco','M MT',hBars(['Banco A','Banco B','Banco C','Banco D','Banco E'].map(function(bank){return {k:bank,v:sum(rows.filter(function(r){return r.bank===bank;}),'value')};}),'Carteira de cheques por banco','M MT'),6)+
      viz('Próximos vencimentos','Próximos 30 dias',table(['Banco','Dias','Valor · M MT'],month.slice().sort(function(a,b){return a.days-b.days;}).slice(0,7).map(function(r){return [r.bank,r.days,nf(r.value,2)];})),6)+
      '<p class="dash__footnote col-12">Os cheques só abatem à dívida quando processados. Carteira e cobrança representam estados diferentes.</p>',true);
  }
  function dashCashVan(){
    var rows=selected(),total=sum(rows,'sales'),vans=[];
    activeRegions().forEach(function(region,ri){
      var amount=sum(rows.filter(function(r){return r.region===region;}),'sales');
      [.34,.28,.23,.15].forEach(function(share,i){var value=amount*share;vans.push({name:'CV '+(regions.indexOf(region)*4+i+1).toString().padStart(3,'0'),region:region,value:value,deposited:value*(.90+i*.025),count:Math.round(value*1e6/(4200+i*450))});});
    });
    vans.sort(function(a,b){return b.value-a.value;});var deposited=sum(vans,'deposited'),count=sum(vans,'count'),max=vans[0].value;
    return shell('Cash Van — vendido, depositado e por depositar',[
      tile('Vendido',nf(total),'M MT','Vendas no período seleccionado'),tile('Número de vendas',nf(count,0),'vendas','Transacções fictícias'),
      tile('Valor médio por venda',nf(total*1e6/count,0),'MT','Vendido / número de vendas'),tile('Cash vans',nf(vans.length,0),'activas','Quatro por região'),
      tile('Depositado',nf(deposited),'M MT',nf(deposited/total*100)+'% do vendido'),tile('Por depositar',warning(nf(total-deposited)),'M MT','Vendido − depositado')],
      viz('Vendido por Cash Van','Ordenado por valor',table(['Cash Van / região','Vendido no período','M MT','Vendas','Depositado · M MT','% depositado'],vans.map(function(v){return ['<details><summary>'+v.name+'</summary><span class="van-region">'+v.region+' · dados fictícios</span></details>','<span class="van-bar"><i style="width:'+v.value/max*100+'%"></i></span>',nf(v.value),nf(v.count,0),nf(v.deposited),nf(v.deposited/v.value*100)+'%'];})),12)+
      viz('Facturação mensal de Cash Van','M MT · actual vs AA',legend()+groupedBars(monthly(rows,'sales','py'),'Facturação de Cash Van e Ano Anterior'),12));
  }
  var FRAMES=[
    {id:'divida',label:'Dívida',tag:'Posição',render:dashDivida,desc:'Posição, vencimentos e concentração. Estrutura inspirada no mapa de Dívida do autor, com dados fictícios.'},
    {id:'cheques',label:'Cheques',tag:'Vencimentos',render:dashCheques,desc:'Cada ponto representa um cheque; a posição mostra o prazo e a área representa o valor.'},
    {id:'cashvan',label:'Cash Van',tag:'Depósitos',render:dashCashVan,desc:'Ranking de vendas, montantes depositados e por depositar, com detalhe por Cash Van.'},
    {id:'tes',label:'Tesouraria',tag:'Caixa',render:dashTesouraria,desc:'Posição de caixa, movimentos e reconciliação entre abertura e fecho.'},
    {id:'frota',label:'Frota',tag:'Eficiência',render:dashFrota,desc:'Custos por natureza, distância e consumo calculados sobre o mesmo período.'},
    {id:'fact',label:'Facturação',tag:'Actual / AA',render:dashFacturacao,desc:'Comparação mensal com Ano Anterior e matriz de variações por região.'},
    {id:'dist',label:'Distribuição',tag:'Cobranças',render:dashDistribuicao,desc:'Facturação e cobranças por região, distinguindo fluxos de posição de dívida.'},
    {id:'stock',label:'Stock / SOR',tag:'Cobertura',render:dashStock,desc:'Posição de inventário, dias de cobertura e stock com mais de 90 dias.'}
  ];
  var controls=document.createElement('div');controls.className='gallery-controls';
  controls.innerHTML='<label>Região<select id="dash-region"><option>Todas</option><option>Sul</option><option>Centro</option><option>Norte</option></select></label><label>Período<select id="dash-period"><option value="ytd">Jan–Nov 2026</option><option value="nov">Novembro 2026</option></select></label><button type="button" id="dash-theme" aria-pressed="false">Fundo escuro</button><button type="button" id="open-map" aria-haspopup="dialog">Ampliar mapa ↗</button><p>Explore os mapas com dados fictícios.</p>';
  stage.before(controls);
  var live=document.createElement('p');live.className='sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');stage.after(live);
  FRAMES.forEach(function(f){
    var b=document.createElement('button');b.type='button';b.id='tab-'+f.id;b.className='gtab';b.setAttribute('role','tab');b.setAttribute('aria-controls','gf-'+f.id);b.dataset.target=f.id;b.innerHTML=esc(f.label)+'<span class="gtab__tag">'+esc(f.tag)+'</span>';tabs.appendChild(b);
    var p=document.createElement('div');p.className='gframe';p.id='gf-'+f.id;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;stage.appendChild(p);
  });
  function render() {
    FRAMES.forEach(function(f){var active=f.id===state.id,b=document.getElementById('tab-'+f.id),p=document.getElementById('gf-'+f.id);b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;p.classList.toggle('is-active',active);p.hidden=!active;if(active)p.innerHTML=f.render()+'<div class="gcap"><b>'+esc(f.label)+'</b><span>'+esc(f.desc)+'</span><span class="gcap__stack">Demonstração HTML/SVG · dados fictícios</span></div>';});
    var period=document.getElementById('dash-period');period.disabled=['stock','divida','cheques'].includes(state.id);period.title=period.disabled?'Este mapa apresenta uma posição fixa em 30 Nov 2026.':'';
    live.textContent=FRAMES.find(function(f){return f.id===state.id;}).label+' · '+state.region+' · '+(period.disabled?'Posição em 30 Nov 2026':period.options[period.selectedIndex].text);
  }
  tabs.addEventListener('click',function(e){var b=e.target.closest('[role="tab"]');if(b){state.id=b.dataset.target;render();}});
  tabs.addEventListener('keydown',function(e){var bs=Array.from(tabs.querySelectorAll('[role="tab"]')),i=bs.indexOf(document.activeElement),next;if(i<0)return;if(e.key==='ArrowRight')next=(i+1)%bs.length;else if(e.key==='ArrowLeft')next=(i+bs.length-1)%bs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=bs.length-1;if(next!=null){e.preventDefault();state.id=bs[next].dataset.target;render();bs[next].focus();}});
  document.getElementById('dash-region').addEventListener('change',function(e){state.region=e.target.value;render();});
  document.getElementById('dash-period').addEventListener('change',function(e){state.period=e.target.value;render();});
  document.getElementById('dash-theme').addEventListener('click',function(e){state.theme=state.theme==='light'?'dark':'light';e.currentTarget.setAttribute('aria-pressed',String(state.theme==='dark'));render();});
  document.querySelectorAll('[data-dashboard]').forEach(function(link){link.addEventListener('click',function(){state.id=link.dataset.dashboard;render();document.getElementById('tab-'+state.id).focus({preventScroll:true});});});
  var hero=document.getElementById('hero-cheques');
  if(hero) {
    hero.innerHTML=chequeSwarm(cheques);
    hero.querySelector('svg').setAttribute('aria-label','Ilustração de carteira de cheques com dados fictícios');
  }
  var caseCheques=document.getElementById('case-cheques');
  if(caseCheques)caseCheques.innerHTML=chequeSwarm(cheques);
  var caseFleet=document.getElementById('case-fleet');
  if(caseFleet)caseFleet.innerHTML=fleetScatter(records);
  render();
})();


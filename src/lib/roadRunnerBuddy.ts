/**
 * Type Runner buddy — original vector artwork (not a trace of any studio asset).
 * A blue desert-runner bird: swept crest, big tail swoosh, long legs.
 *
 * Runs inside a sandboxed iframe (`allow-scripts`, no same-origin). The host
 * pushes `{ type: "nppx:companion", state: { cps, mood } }` via postMessage;
 * CSS custom property `--t` (stride duration) follows typing speed.
 */
const INK = "#1f2937";

export const ROAD_RUNNER_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
:root{--t:3s}
html,body{margin:0;height:100%;background:transparent;overflow:hidden}
svg{width:100%;height:100%;display:block;overflow:visible}
.ink{stroke:${INK};stroke-linejoin:round;stroke-linecap:round}

.lean{transform-origin:120px 130px}
.bob{animation:bob calc(var(--t) / 2) ease-in-out infinite}
.thigh{animation:thigh var(--t) ease-in-out infinite}
.shin{animation:shin var(--t) ease-in-out infinite}
.leg-b .thigh,.leg-b .shin{animation-delay:calc(var(--t) / -2)}
.tail{transform-origin:86px 88px;animation:tail var(--t) ease-in-out infinite}
.crest{transform-origin:162px 38px;animation:crest calc(var(--t) * .8) ease-in-out infinite}

.speed line{stroke:#cbd5e1;stroke-width:2.5;stroke-linecap:round;opacity:0}
.dust ellipse{fill:#d6c3a5;opacity:0}
.zzz text{font:700 14px ui-sans-serif,system-ui,sans-serif;fill:#94a3b8;opacity:0}
.eye-closed{opacity:0}

/* run (default) */
body[data-mood=run] .dust ellipse{animation:puff calc(var(--t) / 2) ease-out infinite}

/* zoom */
body[data-mood=zoom] .lean{transform:rotate(-7deg)}
body[data-mood=zoom] .speed line{animation:rush .32s linear infinite}
body[data-mood=zoom] .speed line:nth-child(2){animation-delay:-.1s}
body[data-mood=zoom] .speed line:nth-child(3){animation-delay:-.2s}
body[data-mood=zoom] .dust ellipse{animation:puff calc(var(--t) / 2) ease-out infinite}

/* nap */
body[data-mood=nap] .bob{animation:breathe 3s ease-in-out infinite}
body[data-mood=nap] .thigh,body[data-mood=nap] .shin,
body[data-mood=nap] .tail,body[data-mood=nap] .crest{animation:none}
body[data-mood=nap] .leg-a .thigh{transform:rotate(7deg)}
body[data-mood=nap] .leg-b .thigh{transform:rotate(-7deg)}
body[data-mood=nap] .shin{transform:rotate(12deg)}
body[data-mood=nap] .eye-open{opacity:0}
body[data-mood=nap] .eye-closed{opacity:1}
body[data-mood=nap] .zzz text{animation:zzz 2.4s ease-in-out infinite}
body[data-mood=nap] .zzz text:nth-child(2){animation-delay:.8s}
body[data-mood=nap] .zzz text:nth-child(3){animation-delay:1.6s}

@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
@keyframes thigh{0%,100%{transform:rotate(-34deg)}50%{transform:rotate(34deg)}}
@keyframes shin{0%,100%{transform:rotate(18deg)}25%{transform:rotate(58deg)}50%{transform:rotate(8deg)}75%{transform:rotate(-6deg)}}
@keyframes tail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
@keyframes crest{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}
@keyframes rush{0%{transform:translateX(26px);opacity:0}30%{opacity:.85}100%{transform:translateX(-22px);opacity:0}}
@keyframes puff{0%{transform:translateX(0) scale(.5);opacity:.55}100%{transform:translateX(-22px) scale(1.5);opacity:0}}
@keyframes zzz{0%{transform:translate(0,6px);opacity:0}40%{opacity:.95}100%{transform:translate(8px,-10px);opacity:0}}
</style></head>
<body data-mood="nap">
<svg viewBox="0 0 240 160" role="img" aria-label="Type Runner">
  <ellipse cx="120" cy="153" rx="46" ry="5" fill="rgba(15,23,42,.2)"/>

  <g class="speed">
    <line x1="30" y1="68" x2="64" y2="68"/>
    <line x1="14" y1="92" x2="54" y2="92"/>
    <line x1="34" y1="116" x2="66" y2="116"/>
  </g>
  <g class="dust">
    <ellipse cx="92" cy="148" rx="9" ry="4"/>
    <ellipse cx="108" cy="150" rx="7" ry="3.5"/>
  </g>

  <g class="lean"><g class="bob">
    <!-- back leg -->
    <g class="leg-b"><g class="thigh" style="transform-origin:118px 108px">
      <path class="ink" d="M118 108 L108 128" stroke-width="9" fill="none"/>
      <path d="M118 108 L108 128" stroke="#d98324" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <g class="shin" style="transform-origin:108px 128px">
        <path class="ink" d="M108 128 L126 142 M126 142 L144 144 M126 142 L138 150 M126 142 L116 148" stroke-width="8" fill="none"/>
        <path d="M108 128 L126 142 M126 142 L144 144 M126 142 L138 150 M126 142 L116 148" stroke="#d98324" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      </g>
    </g></g>

    <!-- tail swoosh -->
    <g class="tail">
      <path class="ink" stroke-width="2.5" fill="#8fbfe8" d="M90 94 C58 100 22 80 10 38 C8 26 18 22 26 30 C34 40 40 46 54 52 C66 58 78 68 96 80Z"/>
      <path d="M22 34 C30 52 48 66 74 76" stroke="#5f9bd3" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>

    <!-- body -->
    <ellipse class="ink" stroke-width="2.5" cx="120" cy="96" rx="43" ry="20" fill="#8fbfe8" transform="rotate(-10 120 96)"/>
    <path class="ink" stroke-width="2" fill="#4f6bb0" d="M96 92 C108 80 132 82 142 97 C127 106 106 105 96 92Z"/>

    <!-- front leg -->
    <g class="leg-a"><g class="thigh" style="transform-origin:122px 108px">
      <path class="ink" d="M122 108 L112 128" stroke-width="9" fill="none"/>
      <path d="M122 108 L112 128" stroke="#f0a030" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <g class="shin" style="transform-origin:112px 128px">
        <path class="ink" d="M112 128 L130 142 M130 142 L148 144 M130 142 L142 150 M130 142 L120 148" stroke-width="8" fill="none"/>
        <path d="M112 128 L130 142 M130 142 L148 144 M130 142 L142 150 M130 142 L120 148" stroke="#f0a030" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      </g>
    </g></g>

    <!-- neck + head -->
    <path class="ink" d="M146 90 C170 80 174 64 168 48" stroke-width="16" fill="none"/>
    <path d="M146 90 C170 80 174 64 168 48" stroke="#8fbfe8" stroke-width="11" stroke-linecap="round" fill="none"/>

    <g class="crest">
      <path class="ink" stroke-width="2.2" fill="#4f6bb0" d="M160 34 C150 12 120 2 96 12 C120 13 138 24 156 46Z"/>
      <path class="ink" stroke-width="2.2" fill="#4f6bb0" d="M168 32 C174 10 156 -3 130 0 C148 6 160 16 164 38Z"/>
    </g>

    <ellipse class="ink" stroke-width="2.5" cx="172" cy="44" rx="15" ry="13" fill="#4f6bb0"/>
    <g class="eye-open">
      <ellipse class="ink" stroke-width="1.6" cx="177" cy="40" rx="7" ry="8" fill="#fff"/>
      <circle cx="179" cy="42" r="3.2" fill="${INK}"/>
      <circle cx="180" cy="40.6" r="1.1" fill="#fff"/>
    </g>
    <path class="eye-closed ink" stroke-width="2" fill="none" d="M171 42 Q177 47 183 42"/>
    <path class="ink" stroke-width="2.4" fill="#f6cf57" d="M185 44 C197 40 211 44 217 50 C211 60 195 60 185 54Z"/>
    <path class="ink" stroke-width="1.6" fill="none" d="M187 53 C197 55 207 54 213 51"/>
  </g></g>

  <g class="zzz">
    <text x="190" y="26">z</text><text x="202" y="14">z</text><text x="214" y="4">Z</text>
  </g>
</svg>
<script>
(function(){
  var b=document.body, lastT=0;
  function apply(s){
    var cps=Number(s.cps)||0, mood=s.mood||"run";
    b.setAttribute("data-mood",mood);
    var t=mood==="nap"?3:Math.max(.2,.95-cps*.05);
    if(Math.abs(t-lastT)>.04){lastT=t;b.style.setProperty("--t",t.toFixed(2)+"s");}
  }
  window.addEventListener("message",function(e){
    var d=e.data;
    if(d&&d.type==="nppx:companion"&&d.state)apply(d.state);
  });
  apply({mood:"nap",cps:0});
})();
</script>
</body></html>`;

let items = [
    { value: 10, weight: 1 },
    { value: 50, weight: 1 },
    { value: 200, weight: 1 }
];

let maxV = 200;
let targetEV = 40;

let low = -50, high = 50;
let bestBeta = 0;
for (let i = 0; i < 60; i++) {
    let mid = (low + high) / 2;
    let w_sum = 0, ev_sum = 0;
    for (let item of items) {
        let v_scaled = item.value / maxV;
        let w = Math.exp(mid * v_scaled);
        w_sum += w;
        ev_sum += w * item.value;
    }
    let ev = ev_sum / w_sum;
    if (ev < targetEV) low = mid;
    else high = mid;
    bestBeta = mid;
}

let min_new_w = Infinity;
let new_weights = items.map(item => {
    let v_scaled = item.value / maxV;
    let w = Math.exp(bestBeta * v_scaled);
    if (w < min_new_w) min_new_w = w;
    return w;
});

let normalized = new_weights.map(w => w / min_new_w);
console.log(normalized.map(w => w.toFixed(2)));

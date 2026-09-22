let items = [
    { value: 10, weight: 1 },
    { value: 50, weight: 1 },
    { value: 200, weight: 1 }
];

let maxV = 200;
let targetEV = 199.9; // Extreme EV

let low = -25, high = 25;
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

let w_sum_final = 0;
let raw_weights = items.map(item => {
    let v_scaled = item.value / maxV;
    let w = Math.exp(bestBeta * v_scaled);
    w_sum_final += w;
    return w;
});

// Normalize so sum is 100,000
let new_weights = raw_weights.map(w => (w / w_sum_final) * 100000);

console.log(new_weights);

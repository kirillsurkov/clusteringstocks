const fs = require("fs");
const Bitmex = require("./bitmex");

module.exports = {
	backtest: (data, candles, count) => {
		let err = []
		let skip = [];
		let counts = [];
		let dists = [];
		let clusters = data.clusters;
		let width = clusters[0].cluster.length;
		let predict = data.predict;
		let curPat = Bitmex.norm(candles.slice(-width+predict));
		for (let i = 0; i < clusters.length; i++) {
			err.push(0);
			skip.push(0);
			counts.push(0);
			dists.push(Bitmex.distPat(Bitmex.norm(clusters[i].cluster.slice(0, curPat.length)), curPat));
		}
		let md = {min: +Infinity, max: -Infinity};
		for (let i = 0; i < dists.length; i++) {
			md.min = Math.min(md.min, dists[i]);
			md.max = Math.max(md.max, dists[i]);
		}
		dists = dists.map(d => (d - md.min) / (md.max - md.min));
		console.log(dists);
		clusters = clusters.map((x, i) => ({index: i, value: x}));
		candles = JSON.parse(fs.readFileSync("candles", "UTF-8"));
		for (let i = 0; i < candles.length-width; i++) {
			let pattern = Bitmex.norm(candles.slice(i, i+width));
			for (let j = 0; j < clusters.length; j++) {
				let d = Bitmex.distPat(clusters[j].value.cluster, pattern.slice(0, -predict));
				if (d > dists[clusters[j].index]) {
					skip[j]++;
					continue;
				}
				let lc = Bitmex.norm(pattern.slice(-predict).slice(0, 1));
				let lcp = Bitmex.norm(clusters[j].value.cluster.slice(-predict).slice(0, 1));
				let dlcp = Bitmex.distPat(lc, lcp);
				if (dlcp > 0.1) {
					err[j]++
				}
				counts[j]++;
			}
		}
		clusters = clusters.map(c => ({index: c.index, value: c.value, perc: (1 - (err[c.index] || 0) / (counts[c.index] || 0))})).sort((c1, c2) => c2.perc - c1.perc);
		console.log(clusters);
		for (let i = 0; i < predict; i++) {
			curPat.push(null);
		}
		return {
			percents: clusters.map(c => c.perc),
			similarities: clusters.map(c => dists[c.index]),
			curPat: curPat,
			clusters: clusters.slice(0, count)
		};
	}
};

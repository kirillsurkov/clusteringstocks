const fs = require("fs");
const Bitmex = require("./bitmex");

function Patterns(candles, size, step=1) {
	let patterns = [];
	for (let i = 0; i < candles.length - size; i += step) {
		let pattern = [];
		for (let j = 0; j < size; j++) {
			pattern.push(candles[i+j]);
		}
		patterns.push(Bitmex.norm(pattern));
	}
	return patterns;
}

function avgPattern(patterns) {
	if (patterns.length == 0) return null;

	let avg = [];

	for (let i = 0; i < patterns[0].length; i++) {
		avg.push({h: 0, l: 0, o: 0, c: 0, v: 0});
	}

	for (let i = 0; i < patterns.length; i++) {
		let pattern = patterns[i];
		for (let j = 0; j < pattern.length; j++) {
			let candle = pattern[j];
			avg[j].l += candle.l / patterns.length;
			avg[j].h += candle.h / patterns.length;
			avg[j].o += candle.o / patterns.length;
			avg[j].c += candle.c / patterns.length;
			avg[j].v += candle.v / patterns.length;
		}
	}

	return avg;
}

function Clusters(patterns, size) {
	let clusters = [patterns[Math.floor(Math.random()*patterns.length)]];
	let counts = [];
	let arr = new Array(patterns.length).fill(0).map((_,i)=>i);
	for (let i = 0; i < size; i++) {
		counts.push(0);
	}
	for (let i = 0; i < size-1; i++) {
		console.log(i+2);
		let sum = 0;
		let patDists = patterns.map((p, id) => {
			let nearC = {dist: +Infinity, cid: null};
			for (let j = 0; j <= i; j++) {
				let dist = Bitmex.distPat(p, clusters[j]);
				if (dist < nearC.dist) {
					nearC.dist = dist;
					nearC.cid = j;
				}
			}
			let dist = Bitmex.distPat(p, clusters[nearC.cid]);
			sum += dist;
			return {
				pid: id,
				dist: dist
			};
		});
		let pid;
		sum *= Math.random();
		patDists.find((p, i) => {
			sum -= p.dist;
			if (sum < 0) {
				pid = i;
				return true;
			}
			return false;
		});
		clusters.push(patterns[pid]);
	}
	while (true) {
		for (let i = 0; i < patterns.length; i++) {
			let pattern = patterns[i];
			let minDist;
			for (let j = 0; j < clusters.length; j++) {
				let cluster = clusters[j];
				let dist = Bitmex.distPat(pattern, cluster);
				if (!minDist || (dist < minDist)) {
					minDist = dist;
					pattern.cluster = j;
				}
			}
		}
		let err = 0;
		for (let i = 0; i < clusters.length; i++) {
			let patternsInCluster = patterns.filter(pattern => pattern.cluster == i);
			let cluster = avgPattern(patternsInCluster);
			if (cluster != null) {
				err += Bitmex.distPat(clusters[i], cluster);
				clusters[i] = cluster;
				counts[i] = patternsInCluster.length;
			}
		}
		console.log(err);
		if (err == 0) break;
	}
	return clusters.map((cluster, i) => ({
		cluster: cluster,
		patterns: patterns.filter(p => p.cluster == i).map(p => ({
			pattern: p,
			dist: Bitmex.distPat(p, cluster)
		})).sort((p1, p2) => p1.dist > p2.dist).map(p => p.pattern),
		count: (100 * counts[i] / patterns.length).toFixed(2)
	}));
}

async function main(width, step, predict) {
//	let candles = await Bitmex.getCandles();
	let candles = JSON.parse(fs.readFileSync("candles", "UTF-8"));
	let patterns = new Patterns(candles, width, step);
	let clusters = new Clusters(patterns.slice(0, patterns.length/2), 200);

	let res = {
		clusters: clusters,
		predict: predict
	};
	fs.writeFileSync("clusters", JSON.stringify(res));
}

main(12, 1, 4);

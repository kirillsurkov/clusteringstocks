function Bitmex() {
	let self = {};
	return self;
}

function getCandles(res, months, symbol) {
	let candles = getCandles(".tmp_candles", res, months, symbol);//JSON.parse(fs.readFileSync("actual_candles", "UTF-8"));
}

function norm(pattern) {
	let min = {c: +Infinity, v: +Infinity};
	let max = {c: -Infinity, v: -Infinity};
	for (let i = 0; i < pattern.length; i++) {
		let candle = pattern[i];
		min.c = Math.min(min.c, candle.l);
		max.c = Math.max(max.c, candle.l);
		min.c = Math.min(min.c, candle.h);
		max.c = Math.max(max.c, candle.h);
		min.c = Math.min(min.c, candle.o);
		max.c = Math.max(max.c, candle.o);
		min.c = Math.min(min.c, candle.c);
		max.c = Math.max(max.c, candle.c);
		min.v = Math.min(min.v, candle.v);
		max.v = Math.max(max.v, candle.v);
	}
	let res = [];
	for (let i = 0; i < pattern.length; i++) {
		let c = {}
		let candle = pattern[i];
		c.l = (candle.l - min.c) / ((max.c - min.c) || 1);
		c.h = (candle.h - min.c) / ((max.c - min.c) || 1);
		c.o = (candle.o - min.c) / ((max.c - min.c) || 1);
		c.c = (candle.c - min.c) / ((max.c - min.c) || 1);
		c.v = (candle.v - min.v) / ((max.v - min.v) || 1);
		res.push(c);
	}
	return res;
}

function distCan(candle1, candle2) {
	let l = candle1.l - candle2.l;
	let h = candle1.h - candle2.h;
	let o = candle1.o - candle2.o;
	let c = candle1.c - candle2.c;
	let v = candle1.v - candle2.v;
	return Math.sqrt(l*l + h*h + o*o + c*c + v*v) / Math.sqrt(5);
}

function distPat(pattern1, pattern2) {
	let dists = [];
	for (let i = 0; i < Math.min(pattern1.length, pattern2.length); i++) {
		dists.push(distCan(pattern1[i], pattern2[i]));
	}
	return dists.reduce((res, dist) => res+dist, 0) / dists.length;//Math.sqrt(dists.reduce((res, dist) => res+dist*dist, 0));
}

function getCandles(res = 5, months = 1, symbol = "XBTUSD") {
	return new Promise(next => {
		let date = Math.floor(+new Date() / 1000);
		console.log(res);
		require("request").get("https://www.bitmex.com/api/udf/history?symbol=" + symbol + "&resolution=" + res + "&from=" + (date - 60*60*24*30*months) + "&to=" + date, /*{
			proxy: "localhost:9050"
		},*/ (err, response, data) => {
			if (err) throw "no response";
			data = JSON.parse(data);
			let candles = data.o.map((_, i) => ({
				l: data.l[i],
				h: data.h[i],
				o: data.o[i],
				c: data.c[i],
				v: data.v[i]
			}));
//			fs.writeFileSync("actual_candles", JSON.stringify(candles));
			next(candles);
		});
	});
}

module.exports = {
	getCandles: getCandles,
	norm: norm,
	distCan: distCan,
	distPat: distPat
};

if (process.argv[2] == "g") {
	getCandles(
		process.argv[3] || "actual_candles",
		process.argv[4] || 5,
		process.argv[5] || 1,
		process.argv[6] || "XBTUSD"
	);
}

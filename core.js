const Bitmex = require("./bitmex");
const backtest = require("./backtest");

let drawCandles = (candles, x, y, alpha, ctx, fill = true, bright = false) => {
	let offset = 155;
	ctx.globalCompositeOperation = fill ? "source-over" : "screen";
	candles.forEach((candle, index) => {
		if (candle == null) return;
		let drawFunc = (x, y, w, h) => fill ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h);
		let setStyle = style => fill ? (ctx.fillStyle = style) : (ctx.strokeStyle = style);
		if (fill) {
			setStyle("rgba(100, 100, 0, " + alpha + ")");
		} else {
			setStyle("rgba(100, 100, 100, " + alpha + ")");
		}
		drawFunc(
			24 + x*candles.length*20 + index*15,
			20 + offset*y + (100 - candle.h * 90),
			2,
			(candle.h - candle.l) * 90
		);
		if (fill) {
			let cVal = bright ? 255 : 200;
			if (candle.o > candle.c)
				setStyle("rgba(" + cVal + ", 0, 0, " + alpha + ")");
			else
				setStyle("rgba(0, " + cVal + ", 0, " + alpha + ")");
		} else {
			if (candle.o > candle.c)
				setStyle("rgba(255, 0, 255, " + alpha + ")");
			else
				setStyle("rgba(0, 255, 255, " + alpha + ")");
		}
		drawFunc(
			20 + x*candles.length*20 + index*15,
			20 + offset*y + (100 - Math.max(candle.o, candle.c) * 90),
			10,
			Math.abs(candle.o - candle.c) * 90
		);
		let v = candle.v;
		if (v >= 0.3) v = Math.pow(v, 1/1.1);
		else v = Math.pow(v, 1.1);
		drawFunc(
			20 + x*candles.length*20 + index*15,
			130 + offset*y + (20 - v * 20),
			10,
			v * 20
		);
	});
}

let init = () => {
	let canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	let ctx = canvas.getContext("2d");
	ctx.font = "bold 12px Monospace";
	let xCnt = 4;
	let x = 0;
	let y = 0;
	let alpha = 1 / 256.0;
	ctx.fillStyle = "rgba(0, 0, 0, 1)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	require("electron").ipcRenderer.on("data", async (event, data) => {
		let predict = data.predict;
		let width = data.clusters[0].length;
		let candles = (await Bitmex.getCandles(60)).slice(0, -1);
		let back = backtest.backtest(data, candles, 16);
		let percents = back.percents;
		let sims = back.similarities;
		let curPat = back.curPat;
		let clusters = back.clusters;
		(function loop(i = 0) {
			if (i >= clusters.length) return;
			let cluster = clusters[i];
			let clusterCenter = cluster.value.cluster;
			let clusterPatterns = cluster.value.patterns;
/*			ctx.fillStyle = "rgba(100, " + intensity + ", 100, 1)";
			ctx.fillRect(
				10 + x*clusterCenter.length*20,
				30 + 120*y,
				15 + clusterCenter.length * 15,
				110
			);
			ctx.fillStyle = "rgba(70, 70, 70, 0.5)";
			ctx.fillRect(
				10 + x*clusterCenter.length*20,
				120 + 120*y,
				15 + clusterCenter.length * 15,
				20
			);
			console.log(clusterPatterns);*/
			clusterPatterns.slice(-750).forEach(cluster => 
				drawCandles(cluster, x, y, alpha, ctx)
			);
			drawCandles(clusterCenter, x, y, 1, ctx, true, true);
			drawCandles(curPat, x, y, 1, ctx, false);
			ctx.fillStyle = "rgba(255, 255, 255, 1)";
			ctx.fillText("#" + cluster.index, 5 + 20+x*clusterCenter.length*20, 165 + 155*y);
			ctx.fillText((100 * percents[i]).toFixed(2) + "%", clusterCenter.length * 15 / 2 - 20 + 20+x*clusterCenter.length*20, 165 + 155*y);
			let intensity = 200 * (1 - sims[i]);
			ctx.fillStyle = "rgba(" + 
				(55 + (200 - intensity)).toFixed(0) + 
				", " + 
				(55 + intensity).toFixed(0) + 
				", 55, 1)";
			ctx.fillText(sims[i].toFixed(2), clusterCenter.length*15 - 18 + x*clusterCenter.length*20, 165 + 155*y);
			ctx.strokeStyle = "rgba(255, 255, 255, 1)";
			ctx.strokeRect(
				20 + x*clusterCenter.length*20, 25 + 155*y,
				clusterCenter.length * 15 - 5, 145
			);
			ctx.strokeRect(
				20 + x*clusterCenter.length*20, 150 + 155*y,
				clusterCenter.length * 15 - 5, 20
			);
			x++;
			if (x >= xCnt) {
				x = 0;
				y++;
			}
			setTimeout(() => loop(i+1), 0);
		})();
	});
};

let config = {
	address: "0.0.0.0",
	port: 8080,
	basePath: "/",
	ipWhitelist: [],
	useHttps: false,
	httpsPrivateKey: "",
	httpsCertificate: "",

	language: "es",
	locale: "es-ES",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"],
	timeFormat: 24,
	units: "metric",
	electronOptions: {
		webPreferences: {
			webviewTag: true
		}
	},

	modules: [
		{
			module: "alert",
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_center",
			config: {
				timezone: "Europe/Madrid",
				displaySeconds: true,
				showDate: true,
				dateFormat: "dddd, D [de] MMMM [de] YYYY",
				showPeriod: false,
				clockBold: true
			}
		},
		{
			module: "compliments",
			position: "middle_center",
			config: {
				updateInterval: 10000,
				fadeSpeed: 4000,
				compliments: {
					anytime: [
						"🎵 Reproduciendo en Spotify",
						"♪ Disfruta tu música ♪",
						"🎶 RaspberryPi Music Player"
					],
					morning: [
						"☀️ Buenos días",
						"🎵 Música para empezar el día"
					],
					afternoon: [
						"☁️ Buenas tardes",
						"♪ Música para la tarde"
					],
					evening: [
						"🌙 Buenas noches",
						"🎶 Música para relajarse"
					]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}

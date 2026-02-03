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
			position: "top_left",
			config: {
				timezone: "Europe/Madrid",
				displaySeconds: false,
				showDate: true,
				dateFormat: "dddd, D [de] MMMM [de] YYYY"
			}
		},
		{
			module: "compliments",
			position: "lower_third",
			config: {
				compliments: {
					anytime: [
						"¡Buen día!",
						"¡Que tengas un gran día!",
						"¡Disfruta tu música!"
					],
					morning: [
						"¡Buenos días!",
						"¡Que tengas una mañana genial!"
					],
					afternoon: [
						"¡Buenas tardes!",
						"¡Sigue así!"
					],
					evening: [
						"¡Buenas noches!",
						"¡Dulces sueños!"
					]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}

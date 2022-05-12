const fs = require("fs");
const j2s = require("joi-to-swagger");

let singleton = undefined;
const { USER_ROLE } = require('../../utils/constants');

class Swagger {
    constructor() {
        let swaggerData = {
            swagger: "2.0",
            info: {
                version: "1.0.0",
                title: "Pixstory Application",
                description: "Pixstory API documentation",
                contact: {
                    name: "YS Team",
                }
            },
            // basePath: "/api",
            paths: {},
            definitions: {},
            schemes: ["http", "https"],
            consumes: ["application/json"],
            produces: ["application/json"],
            securityDefinitions: {
                // APIKeyHeader: {
                //     "type": "apiKey",
                //     "name": "authorization",
                //     "in": "header"
                // }
            }
            // security definitions can be multiple
        };

        /** Adding Security definitions Header for each role */
        Object.keys(USER_ROLE).forEach(auth => {
            swaggerData.securityDefinitions[`${USER_ROLE[auth]}TokenHeader`] = {
                "type": "apiKey",
                "name": "authorization",
                "in": "header"
            }
        });
        return fs.writeFileSync("swagger.json", JSON.stringify(swaggerData));
    }

    static instance() {
        if (!singleton) {
            singleton = new Swagger();
            singleton.currentRoute = [];
            singleton.paths = {};
            singleton.definitions = {};
            return singleton;
        }

        return this;
    }

    addNewRoute(joiDefinitions, path, method, auths) {
        if (this.currentRoute.includes(path + method)) {
            return false;
        }

        
        this.currentRoute.push(path + method);

        const swaggerData = fs.readFileSync("swagger.json", "utf-8");
        const otherData = JSON.parse(swaggerData);
        const name = joiDefinitions.model || Date.now();
        const tag = joiDefinitions.group || "default";
        const summary = joiDefinitions.description || "No desc";

        const toSwagger = j2s(joiDefinitions).swagger;
        if (toSwagger && toSwagger.properties && toSwagger.properties.body) {
            this.definitions = {
                ...this.definitions,
                [name]: toSwagger.properties.body,
            };
        }
        //adding responses body definitions
        if (
            toSwagger &&
            toSwagger.properties &&
            toSwagger.properties.responses &&
            toSwagger.properties.responses.properties
        ) {
            let responses = toSwagger.properties.responses.properties;
            Object.keys(responses).forEach((responseCode) => {
                responses[responseCode].properties.body &&
                    (this.definitions = {
                        ...this.definitions,
                        [name + `_` + responseCode]:
                            responses[responseCode].properties.body,
                    });
            });
        }

        const pathArray = path.split("/").filter(Boolean);
        const transformPath = pathArray
            .map((path) => {
                if (path.charAt(0) === ":") {
                    return `/{${path.substr(1)}}`;
                }

                return `/${path}`;
            })
            .join("");

        const parameters = [];
        const security = [];
        const swaggerResponses = {};

        const { body, params, query, headers, formData, responses } =
            joiDefinitions;

        if (body) {
            parameters.push({
                in: "body",
                name: "body",
                // ...toSwagger.properties.body
                schema: {
                    $ref: `#/definitions/${name}`,
                },
            });
        }

        if (params) {
            const getParams = [];
            const rxp = /{([^}]+)}/g;
            let curMatch;

            while ((curMatch = rxp.exec(transformPath))) {
                getParams.push(curMatch[1]);
            }
            let requiredFields = toSwagger.properties.params.required;
            getParams.forEach((param) => {
                let index = requiredFields
                    ? requiredFields.findIndex((key) => key === param)
                    : -1;

                if (index > -1) {
                    toSwagger.properties.params.properties[param].required = true;
                }
                parameters.push({
                    name: param,
                    in: "path",
                    ...toSwagger.properties.params.properties[param],
                });
            });
        }

        if (query) {
            const keys = Object.keys(toSwagger.properties.query.properties).map(
                (key) => key
            );
            let requiredFields = toSwagger.properties.query.required;
            keys.forEach((key) => {
                let index = requiredFields
                    ? requiredFields.findIndex((requiredKey) => requiredKey === key)
                    : -1;
                if (index > -1) {
                    toSwagger.properties.query.properties[key].required = true;
                }
                parameters.push({
                    in: "query",
                    name: key,
                    ...toSwagger.properties.query.properties[key],
                });
            });
        }

        if (formData) {
            toSwagger.properties.formData.properties = {
                ...(toSwagger.properties.formData.properties.file && toSwagger.properties.formData.properties.file.properties),
                ...(toSwagger.properties.formData.properties.fileArray && toSwagger.properties.formData.properties.fileArray.properties),
                ...(toSwagger.properties.formData.properties.files && toSwagger.properties.formData.properties.files.properties),
                ...(toSwagger.properties.formData.properties.body && toSwagger.properties.formData.properties.body.properties),
            }
            const keys = Object.keys(toSwagger.properties.formData.properties).map((key) => key);
            let requiredFields = toSwagger.properties.formData.required;
            keys.forEach((key) => {
                let index = requiredFields ? requiredFields.findIndex(requiredKey => requiredKey === key) : -1;
                if (index > -1) {
                    toSwagger.properties.formData.properties[key].required = true;
                }
                parameters.push({
                    "in": "formData",
                    "name": key,
                    ...toSwagger.properties.formData.properties[key]
                });
            });
        }

        if (headers) {
            const keys = Object.keys(toSwagger.properties.headers.properties).map(
                (key) => key
            );
            let requiredFields = toSwagger.properties.headers.required;
            keys.forEach((key) => {
                let index = requiredFields
                    ? requiredFields.findIndex((requiredKey) => requiredKey === key)
                    : -1;
                if (index > -1) {
                    toSwagger.properties.headers.properties[key].required = true;
                }
                parameters.push({
                    in: "header",
                    name: key,
                    ...toSwagger.properties.headers.properties[key],
                });
            });
        }

        if (responses) {
            Object.keys(responses).forEach((responseCode) => {
                swaggerResponses[responseCode] = {};
                if (responses[responseCode].description) {
                    swaggerResponses[responseCode].description = responses[responseCode]
                        .description
                        ? responses[responseCode].description
                        : "";
                }
                if (responses[responseCode].body) {
                    swaggerResponses[responseCode].schema = {
                        $ref: `#/definitions/${name + `_` + responseCode}`,
                    };
                }
            });
        }

        if (this.paths && this.paths[transformPath]) {
            this.paths[transformPath] = {
                ...this.paths[transformPath],
                [method]: {
                    tags: [tag],
                    summary,
                    responses: swaggerResponses,
                    parameters,
                    security
                },
            };
        } else {
            this.paths = {
                ...this.paths,
                [transformPath]: {
                    [method]: {
                        tags: [tag],
                        summary,
                        responses: swaggerResponses,
                        parameters,
                        security
                    },
                },
            };
        }

        // add security for specific routes based on auth.
        this.paths[transformPath][method].security = [];
        if (auths) {
            auths.forEach(auth => {
                if (Object.values(USER_ROLE).includes(auth)) {
                    let securityObject = {};
                    securityObject[`${auth}TokenHeader`] = [];
                    this.paths[transformPath][method].security.push(securityObject);
                }
            })
        }

        const newData = {
            ...otherData,
            definitions: this.definitions,
            paths: this.paths,
        };

        return fs.writeFileSync("swagger.json", JSON.stringify(newData));
    }
}

exports.swaggerDoc = Swagger.instance();

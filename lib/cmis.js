"use strict";

import 'url-search-params-polyfill'

Object.defineProperty(exports, "__esModule", { value: true });
var cmis;
(function (cmis) {

    // if (typeof (window) === 'undefined') {
    //     var window = {};
    // }
    // const fetch = global['fetch'] || require('isomorphic-fetch');
    // const URLSearchParams = window['URLSearchParams'] || require('urlsearchparams').URLSearchParams;
    // const btoa = window['btoa'] || require('isomorphic-base64').btoa;
    // const FormData = window['FormData'] || require('isomorphic-form-data');
    
    class Options {
        constructor() {
            this.succinct = true;
        }
    }
    ;
    /**
     * An error wrapper to handle response in Promise.catch()
     *
     * @export
     * @class HTTPError
     * @extends {Error}
     */
    class HTTPError extends Error {
        constructor(response) {
            super(response.statusText);
            this.response = response;
        }
    }
    cmis.HTTPError = HTTPError;
    /**
     * The session is the entry point for all cmis requests
     *
     * example usage:
     *
     *      // typescript/es6
     *      let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
     *      session.setCredentials(username, password).loadRepositories()
     *          .then(() => session.query("select * from cmis:document"))
     *          .then(data => console.log(data));
     *
     *      // javascript/es5
     *      var session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
     *      session.setCredentials(username, password).loadRepositories().then(function(){
     *            return session.query("select * from cmis:document"));
     *      }).then(function(data) {console.log(data);});
     *
     * @export
     * @class CmisSession
     */
    class CmisSession {
        /**
         * Creates an instance of CmisSession.
         * @param {string} url
         *
         * @memberOf CmisSession
         */
        constructor(url) {
            this.options = { succinct: true };
            this.url = url;
        }
        /**
         * format properties for requests
         *
         * @private
         * @param {Options} options
         * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties
         *
         * @memberof CmisSession
         */
        setProperties(options, properties) {
            var i = 0;
            for (var id in properties) {
                options['propertyId[' + i + ']'] = id;
                var propertyValue = properties[id];
                if (propertyValue !== null && propertyValue !== undefined) {
                    if (Object.prototype.toString.apply(propertyValue) == '[object Array]') {
                        let multiProperty = propertyValue;
                        for (var j = 0; j < multiProperty.length; j++) {
                            options['propertyValue[' + i + '][' + j + ']'] = multiProperty[j];
                        }
                    }
                    else {
                        options['propertyValue[' + i + ']'] = propertyValue;
                    }
                }
                i++;
            }
        }
        /**
         * format policies for requests
         *
         * @private
         * @param {Options} options
         * @param {Array<string>} policies
         *
         * @memberOf CmisSession
         */
        setPolicies(options, policies) {
            for (let i = 0; i < policies.length; i++) {
                options['policy[' + i + ']'] = policies[i];
            }
        }
        ;
        /**
         * format ACEs for requests
         *
         * @private
         * @param {Options} options
         * @param {{[k:string]:string}} ACEs
         * @param {('add'|'remove')} action
         *
         * @memberOf CmisSession
         */
        setACEs(options, ACEs, action) {
            let i = 0;
            for (let id in ACEs) {
                options[action + 'ACEPrincipal[' + i + ']'] = id;
                let ace = ACEs[id];
                for (let j = 0; j < ace.length; j++) {
                    options[action + 'ACEPermission[' + i + '][' + j + ']'] = ACEs[id][j];
                }
                i++;
            }
        }
        ;
        /**
         * format secondaryTypeIds for requests
         *
         * @private
         * @param {Options} options
         * @param {Array<string>} secondaryTypeIds
         * @param {('add'|'remove')} action
         *
         * @memberOf CmisSession
         */
        setSecondaryTypeIds(options, secondaryTypeIds, action) {
            for (let i = 0; i < secondaryTypeIds.length; i++) {
                options[action + 'SecondaryTypeId[' + i + ']'] = secondaryTypeIds[i];
            }
        }
        ;
        /**
         * internal method to perform http requests
         *
         * @private
         * @param {('GET' | 'POST')} method
         * @param {String} url
         * @param {Options} [options]
         * @returns {Promise<Response>}
         *
         * @memberOf CmisSession
         */
        http(method, url, options, multipartData) {
            let usp = new URLSearchParams();
            for (let k in options) {
                if (options[k] != null && options[k] !== undefined) {
                    usp.append(k, options[k]);
                }
            }
            for (let k in this.options) {
                if (!usp.has(k) && this.options[k] != null && this.options[k] !== undefined) {
                    usp.append(k, this.options[k]);
                }
            }
            let auth;
            if (this.username && this.password) {
                auth = 'Basic ' + btoa(`${this.username}:${this.password}`);
            }
            else if (this.token) {
                auth = `Bearer ${this.token}`;
            }
            let cfg = { method: method };
            if (auth) {
                cfg.headers = {
                    'Authorization': auth
                };
            }
            else {
                cfg.credentials = 'include';
            }
            if (multipartData) {
                let formData = new FormData();
                let content = multipartData.content;
                if ('string' == typeof content) {
                    if ('undefined' === typeof Buffer) {
                        content = new Blob([content]);
                    }
                    else {
                        content = new Buffer(content);
                    }
                }
                formData.append('content', content, multipartData.mimeTypeExtension ? multipartData.filename + '.' + multipartData.mimeTypeExtension : multipartData.filename);
                cfg.body = formData;
            }
            let response = fetch(`${url}?${usp.toString()}`, cfg).then(res => {
                if (res.status < 200 || res.status > 299) {
                    throw new HTTPError(res);
                }
                return res;
            });
            if (this.errorHandler) {
                response.catch(err => this.errorHandler(err));
            }
            return response;
        }
        ;
        /**
         * shorthand for http.('GET',...)
         *
         * @private
         * @param {String} url
         * @param {Options} [options]
         * @returns {Promise<Response>}
         *
         * @memberOf CmisSession
         */
        get(url, options) {
            return this.http('GET', url, options);
        }
        /**
         * shorthand for http.('POST',...)
         *
         * @private
         * @param {String} url
         * @param {Options} [options]
         * @returns {Promise<Response>}
         *
         * @memberOf CmisSession
         */
        post(url, options, multipartData) {
            return this.http('POST', url, options, multipartData);
        }
        /**
         * sets token for authentication
         *
         * @param {string} token
         * @returns {CmisSession}
         *
         * @memberOf CmisSession
         */
        setToken(token) {
            this.options.token = token;
            return this;
        }
        /**
         * sets credentials for authentication
         *
         * @param {string} username
         * @param {string} password
         * @returns {CmisSession}
         *
         * @memberOf CmisSession
         */
        setCredentials(username, password) {
            this.username = username;
            this.password = password;
            return this;
        }
        /**
         * sets global error handler
         *
         * @param {(err: Error) => void} handler
         *
         * @memberOf CmisSession
         */
        setErrorHandler(handler) {
            this.errorHandler = handler;
        }
        /**
         * Connects to a cmis server and retrieves repositories,
         * token or credentils must already be set
         *
         * @returns {Promise<void>}
         *
         * @memberOf CmisSession
         */
        loadRepositories() {
            return this.get(this.url, this.options).then(res => {
                return res.json().then(data => {
                    for (let repo in data) {
                        this.defaultRepository = data[repo];
                        break;
                    }
                    this.repositories = data;
                    return;
                });
            });
        }
        /**
         * gets repository informations
         *
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getRepositoryInfo() {
            return this.get(this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
                .then(res => res.json());
        }
        /**
         * gets the types that are immediate children
         * of the specified typeId, or the base types if no typeId is provided
         *
         * @param {string} [typeId]
         * @param {boolean} [includePropertyDefinitions]
         * @param {{maxItems:number,skipCount:number}} [options]
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getTypeChildren(typeId, includePropertyDefinitions, options) {
            return this.get(this.defaultRepository.repositoryUrl, {
                cmisselector: 'typeChildren',
                typeId: typeId,
                includePropertyDefinitions: includePropertyDefinitions
            }).then(res => res.json());
        }
        /**
         * gets all types descended from the specified typeId, or all the types
         * in the repository if no typeId is provided
         *
         * @param {string} [typeId]
         * @param {number} [depth]
         * @param {boolean} [includePropertyDefinitions]
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getTypeDescendants(typeId, depth, includePropertyDefinitions) {
            return this.get(this.defaultRepository.repositoryUrl, {
                cmisselector: 'typeDescendants',
                typeId: typeId,
                includePropertyDefinitions: includePropertyDefinitions,
                depth: depth
            }).then(res => res.json());
        }
        /**
         * gets definition of the specified type
         *
         * @param {string} typeId
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getTypeDefinition(typeId) {
            return this.get(this.defaultRepository.repositoryUrl, {
                cmisselector: 'typeDefinition',
                typeId: typeId,
            }).then(res => res.json());
        }
        /**
         * gets the documents that have been checked out in the repository
         *
         * @param {string} [objectId]
         * @param {{
         *         filter?: string,
         *         maxItems?: number,
         *         skipCount?: number,
         *         orderBy?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         succinct?: boolean }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getCheckedOutDocs(objectId, options = {}) {
            let o = options;
            o.cmisselector = 'checkedOut';
            return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * performs a cmis query against the repository
         * @param {string} statement
         * @param {boolean} [searchAllVersions=false]
         * @param {{
         *         maxItems?: number,
         *         skipCount?: number,
         *         orderBy?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         succinct?: boolean
         *       }} options [options={}]
         * @returns {Promise<any>}
         *
         */
        query(statement, searchAllVersions = false, options = {}) {
            let o = options;
            o.cmisaction = 'query';
            o.statement = statement;
            o.searchAllVersions = searchAllVersions;
            return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * Creates a new type definition
         * @param {any} type
         * @return {Promise<any>}
         *
         */
        createType(type) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'createType',
                type: JSON.stringify(type)
            }).then(res => res.json());
        }
        ;
        /**
         * Updates a type definition
         * @param {any} type
         * @return {Promise<any>}
         *
         */
        updateType(type) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'updateType',
                type: JSON.stringify(type)
            }).then(res => res.json());
        }
        ;
        /**
         * Deletes a type definition
         * @param {string} type
         * @return {Promise<any>}
         *
         */
        deleteType(typeId) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'deleteType',
                typeId: JSON.stringify(typeId)
            }).then(res => res.json());
        }
        ;
        /**
         * gets an object by path
         *
         * @param {string} path
         * @param {{
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includeACL?: boolean,
         *         includePolicyIds?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getObjectByPath(path, options = {}) {
            let o = options;
            o.cmisselector = 'object';
            var sp = path.split('/');
            for (var i = sp.length - 1; i >= 0; i--) {
                sp[i] = encodeURIComponent(sp[i]);
            }
            return this.get(this.defaultRepository.rootFolderUrl + sp.join('/'), o).then(res => res.json());
        }
        ;
        /**
         * gets an object by objectId
         *
         * @param {string} objectId
         * @param {('this' | 'latest' | 'latestmajor')} [returnVersion]
         * @param {{
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includeACL?: boolean,
         *         includePolicyIds?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getObject(objectId, returnVersion, options = {}) {
            let o = options;
            o.cmisselector = 'object';
            o.objectId = objectId;
            o.returnVersion = returnVersion;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * creates a new folder
         *
         * @param {string} parentId
         * @param {string} name
         * @param {string} [type='cmis:folder']
         * @param {Array<any>} [policies=[]]
         * @param {{ [k: string]: string }} [addACEs={}]
         * @param {{ [k: string]: string }} [removeACEs={}]
         * @returns Promise<any>
         *
         * @memberOf CmisSession
         */
        createFolder(parentId, name, type = 'cmis:folder', policies = [], addACEs = {}, removeACEs = {}) {
            let options = new Options();
            options.objectId = parentId;
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'createFolder';
            let properties = {
                'cmis:name': name,
                'cmis:objectTypeId': type
            };
            this.setProperties(options, properties);
            this.setPolicies(options, policies);
            this.setACEs(options, addACEs, 'add');
            this.setACEs(options, removeACEs, 'remove');
            return this.post(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
        }
        ;
        /**
         * Returns children of object specified by id
         *
         * @param {string} objectId
         * @param {{
         *         maxItems?: number,
         *         skipCount?: number,
         *         filter?: string,
         *         orderBy?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includePathSegment?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getChildren(objectId, options = {}) {
            let o = options;
            o.cmisselector = 'children';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Gets all descendants of specified folder
         *
         * @param {string} folderId
         * @param {number} [depth]
         * @param {{
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includePathSegment?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getDescendants(folderId, depth, options = {}) {
            let o = options;
            o.cmisselector = 'descendants';
            if (depth) {
                o.depth = depth;
            }
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Gets the folder tree of the specified folder
         *
         * @param {string} folderId
         * @param {number} [depth]
         * @param {{
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includePathSegment?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberOf CmisSession
         */
        getFolderTree(folderId, depth, options = {}) {
            let o = options;
            o.cmisselector = 'folderTree';
            if (depth) {
                o.depth = depth;
            }
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Gets the parent folder of the specified folder
         *
         * @param {string} folderId
         * @param {{ succinct?: boolean }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getFolderParent(folderId, options = {}) {
            let o = options;
            o.cmisselector = 'parent';
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Gets the folders that are the parents of the specified object
         *
         * @param {string} objectId
         * @param {{
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includePathSegment?: boolean,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getParents(objectId, options = {}) {
            let o = options;
            o.cmisselector = 'parents';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Gets the allowable actions of the specified object
         *
         * @param {string} objectId
         * @param {{
         *         filter?: string,
         *         maxItems?: number,
         *         skipCount?: number,
         *         orderBy?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         succinct?: boolean}} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getAllowableActions(objectId, options = {}) {
            let o = options;
            o.cmisselector = 'allowableActions';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
        * Gets the properties of the specified object
        *
        * @param {string} objectId
        * @param {('this' | 'latest' | 'latestmajor')} [returnVersion]
        * @param {QueryOptions} [queryOptions={}]
        * @returns {Promise<any>}
        *
        * @memberOf CmisSession
        */
        getProperties(objectId, returnVersion, options = {}) {
            let o = options;
            o.cmisselector = 'properties';
            o.objectId = objectId;
            o.returnVersion = returnVersion;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Updates properties of specified object
         *
         * @param {string} objectId
         * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties
         * @param {{
         *         changeToken?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        updateProperties(objectId, properties, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'update';
            this.setProperties(options, properties);
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Moves an object
         *
         * @param {string} objectId
         * @param {string} sourceFolderId
         * @param {string} targetFolderId
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        moveObject(objectId, sourceFolderId, targetFolderId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'move';
            o.targetFolderId = targetFolderId;
            o.sourceFolderId = sourceFolderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * creates a new document
         *
         * @param {string} parentId
         * @param {(string | Blob | Buffer)} content
         * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input
         * if `input` is a string used as the document name,
         * if `input` is an object it must contain required properties:
         *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
         * @param {string} [mimeTypeExtension]
         * extension corresponding to mimeType.
         * example: 'pdf', 'png', 'jpg',
         * use this param if your filename does not have a standard extension (tested only with Alfresco)
         * @param {('none' | 'major' | 'minor' | 'checkedout')} [versioningState]
         * @param {string[]} [policies]
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        createDocument(parentId, content, input, mimeTypeExtension, versioningState, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:document';
            }
            if (versioningState) {
                o.versioningState = versioningState;
            }
            o.objectId = parentId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.repositoryId = this.defaultRepository.repositoryId;
            o.cmisaction = 'createDocument';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: properties['cmis:name'],
                mimeTypeExtension: mimeTypeExtension
            }).then(res => res.json());
        }
        ;
        /**
         * Updates properties of specified objects
         *
         * @param {string[]} objectIds
         * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} [properties={}]
         * @param {string[]} [addSecondaryTypeIds=[]]
         * @param {string[]} [removeSecondaryTypeIds=[]]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        bulkUpdateProperties(objectIds, properties = {}, addSecondaryTypeIds = [], removeSecondaryTypeIds = []) {
            let options = new Options();
            for (var i = objectIds.length - 1; i >= 0; i--) {
                options['objectId[' + i + ']'] = objectIds[i];
            }
            options.objectIds = objectIds;
            this.setProperties(options, properties);
            this.setSecondaryTypeIds(options, addSecondaryTypeIds, 'add');
            this.setSecondaryTypeIds(options, removeSecondaryTypeIds, 'remove');
            options.cmisaction = 'bulkUpdate';
            return this.post(this.defaultRepository.repositoryUrl, options).then(res => res.json());
        }
        ;
        /**
         * Gets document content
         * @param {string} objectId
         * @param {('attachment'|'inline')} [download='inline']
         * @param {string} [streamId]
         * @returns {Promise<Response>}
         *
         * @memberof CmisSession
         */
        getContentStream(objectId, download = 'inline', streamId) {
            let options = new Options();
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = (!!download) ? 'attachment' : 'inline';
            return this.get(this.defaultRepository.rootFolderUrl, options);
        }
        ;
        /**
         *
         *
         * @param {string} parentId
         * @param {string} sourceId
         * @param {(string | Blob | Buffer)} content
         * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input
         * if `input` is a string used as the document name,
         * if `input` is an object it must contain required properties:
         *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
         * @param {string} [mimeTypeExtension] extension corresponding to mimeType.
         * example: 'pdf', 'png', 'jpg',
         * use this param if your filename does not have a standard extension (tested only with Alfresco)
         * @param {('none' | 'major' | 'minor' | 'checkedout')} [versioningState]
         * @param {string[]} [policies]
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        createDocumentFromSource(parentId, sourceId, content, input, mimeTypeExtension, versioningState, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:document';
            }
            if (versioningState) {
                o.versioningState = versioningState;
            }
            o.objectId = parentId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.repositoryId = this.defaultRepository.repositoryId;
            o.sourceId = sourceId;
            o.cmisaction = 'createDocumentFromSource';
            let multipartData = null;
            if (content) {
                multipartData = {
                    content: content,
                    filename: properties['cmis:name'],
                    mimeTypeExtension: mimeTypeExtension
                };
            }
            return this.post(this.defaultRepository.rootFolderUrl, o, multipartData).then(res => res.json());
        }
        ;
        /**
         * Gets document content URL
         *
         * @param {string} objectId
         * @param {('attachment' | 'inline')} [download='inline']
         * @param {string} streamId
         * @returns {string}
         *
         * @memberof CmisSession
         */
        getContentStreamURL(objectId, download = 'inline', streamId) {
            let options = new Options();
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = download;
            options.streamId = streamId;
            let usp = new URLSearchParams();
            for (let k in options) {
                if (options[k] != null && options[k] !== undefined) {
                    usp.append(k, options[k]);
                }
            }
            for (let k in this.options) {
                if (!usp.has(k) && this.options[k] != null && this.options[k] !== undefined) {
                    usp.append(k, this.options[k]);
                }
            }
            return `${this.defaultRepository.rootFolderUrl}?${usp.toString()}`;
        }
        ;
        /**
         * gets document renditions
         *
         * @param {string} objectId
         * @param {{
         *         renditionFilter: string,
         *         maxItems?: number,
         *         skipCount?: number
         *       }} [options={
         *           renditionFilter: '*'
         *         }]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getRenditions(objectId, options = {
                renditionFilter: '*'
            }) {
            let o = options;
            o.cmisselector = 'renditions';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * checks out a document
         *
         * @param {string} objectId
         * @param {{ succinct?: boolean }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        checkOut(objectId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'checkOut';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * cancels a check out
         *
         * @param {string} objectId
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        cancelCheckOut(objectId) {
            let options = new Options();
            options.objectId = objectId;
            options.cmisaction = 'cancelCheckOut';
            return this.post(this.defaultRepository.rootFolderUrl, options);
        }
        ;
        /**
         * checks in a document, if needed mimetype may be specified as
         * input['cmis:contentStreamMimeType'] or as option.mimeType
         *
         * @param {string} objectId
         * @param {boolean} [major=false]
         * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input
         * if `input` is a string used as the document name,
         * if `input` is an object it must contain required properties:
         *   {'cmis:name': 'docName'}
         * @param {(string | Blob | Buffer)} content
         * @param {string} [comment]
         * @param {string[]} [policies]
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        checkIn(objectId, major = false, input, content, comment, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (comment) {
                o.checkinComment = comment;
            }
            o.major = major;
            o.objectId = objectId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'checkIn';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: properties['cmis:name']
            }).then(res => res.json());
        }
        ;
        /**
         * Gets the latest document object in the version series
         *
         * {@link http://docs.oasis-open.org/cmis/CMIS/v1.1/CMIS-v1.1.html#x1-3360004}
         *
         * @param {string} versionSeriesId
         * @param {{
         *         major?: boolean,
         *         filter?: string,
         *         renditionFilter?: string,
         *         includeAllowableActions?: boolean,
         *         includeRelationships?: boolean,
         *         includeACL?: boolean,
         *         includePolicyIds?: boolean,
         *         succinct?: boolean
         *       }} [options={ major: false }]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getObjectOfLatestVersion(versionSeriesId, options = { major: false }) {
            let o = options;
            o.cmisselector = 'object';
            o.objectId = versionSeriesId;
            o.versionSeriesId = versionSeriesId;
            o.major = options.major;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Updates content of document
         *
         * @param {string} objectId
         * @param {(string | Blob | Buffer)} content
         * @param {boolean} [overwriteFlag=false]
         * @param {string} [filename] (will not change document name: for mimetype detection by repository)
         * @param {{
         *         changeToken?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        setContentStream(objectId, content, overwriteFlag = false, filename, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.overwriteFlag = overwriteFlag;
            o.cmisaction = 'setContent';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: filename
            }).then(res => res.json());
        }
        ;
        /**
         * Appends content to document
         *
         * @param {string} objectId
         * @param {(string | Blob | Buffer)} content
         * @param {boolean} [isLastChunk=false]
         * @param {string} [filename] (will not change document name: for mimetype detection by repository)
         * @param {{
         *         changeToken?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        appendContentStream(objectId, content, isLastChunk = false, filename, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'appendContent';
            o.isLastChunk = isLastChunk;
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: filename
            }).then(res => res.json());
        }
        ;
        /**
         * deletes object content
         *
         * @param {string} objectId
         * @param {{
         *         changeToken?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        deleteContentStream(objectId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'deleteContent';
            return this.post(this.defaultRepository.rootFolderUrl, o);
        }
        ;
        /**
         * gets versions of object
         *
         * @param {string} versionSeriesId
         * @param {{
         *         filter?:string,
         *         includeAllowableActions?:boolean,
         *         succinct?:boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getAllVersions(versionSeriesId, options = {}) {
            let o = options;
            o.versionSeriesId = versionSeriesId;
            o.cmisselector = 'versions';
            return this.get(this.defaultRepository.rootFolderUrl, o);
        }
        ;
        /**
         * gets object applied policies
         *
         * @param {string} objectId
         * @param {{
         *         filter?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getAppliedPolicies(objectId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisselector = 'policies';
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * gets object ACL
         *
         * @param {string} objectId
         * @param {boolean} [onlyBasicPermissions=false]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getACL(objectId, onlyBasicPermissions = false) {
            let options = new Options();
            options.objectId = objectId;
            options.onlyBasicPermissions = onlyBasicPermissions;
            options.cmisselector = 'acl';
            return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
        }
        ;
        /**
         * deletes an object
         * @param {String} objectId
         * @param {Boolean} allVersions
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
         */
        deleteObject(objectId, allVersions = false) {
            let options = new Options();
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'delete';
            options.objectId = objectId;
            options.allVersions = allVersions;
            return this.post(this.defaultRepository.rootFolderUrl, options);
        }
        ;
        /**
         * Deletes a folfder tree
         *
         * @param {any} objectId
         * @param {boolean} [allVersions=false]
         * @param {('unfile' | 'deletesinglefiled' | 'delete')} [unfileObjects]
         * @param {boolean} [continueOnFailure=false]
         * @returns {Promise<Response>}
         *
         * @memberof CmisSession
         */
        deleteTree(objectId, allVersions = false, unfileObjects, continueOnFailure = false) {
            let options = new Options();
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'deleteTree';
            options.objectId = objectId;
            options.allVersions = !!allVersions;
            if (unfileObjects) {
                options.unfileObjects = unfileObjects;
            }
            options.continueOnFailure = continueOnFailure;
            return this.post(this.defaultRepository.rootFolderUrl, options);
        }
        ;
        /**
         * gets the changed objects, the list object should contain the next change log token.
         * @param {String} changeLogToken
         * @param {Boolean} includeProperties
         * @param {Boolean} includePolicyIds
         * @param {Boolean} includeACL
         * @param {Object} options (possible options: maxItems, succinct, token)
         * @return {CmisRequest}
         */
        getContentChanges(changeLogToken, includeProperties = false, includePolicyIds = false, includeACL = false, options = {}) {
            let o = options;
            o.cmisselector = 'contentChanges';
            if (changeLogToken) {
                o.changeLogToken = changeLogToken;
            }
            o.includeProperties = includeProperties;
            o.includePolicyIds = includePolicyIds;
            o.includeACL = includeACL;
            return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * Creates a relationship
         *
         * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties
         * @param {string[]} [policies]
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        createRelationship(properties, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createRelationship';
            return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * Creates a policy
         *
         * @param {string} folderId
         * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties
         * @param {string[]} [policies]
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        createPolicy(folderId, properties, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            o.objectId = folderId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createPolicy';
            return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * Creates an item
         * @param {String} folderId
         * @param {Object} properties
         * @param {Array} policies
         * @param {Object} addACEs
         * @param {Object} removeACEs
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        createItem(folderId, properties, policies, addACEs, removeACEs, options = {}) {
            let o = options;
            o.objectId = folderId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createItem';
            return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
        }
        ;
        /**
         * gets last result
         *
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getLastResult() {
            return this.post(this.defaultRepository.repositoryUrl, { cmisaction: 'lastResult' }).then(res => res.json());
        }
        ;
        /**
         * Adds specified object to folder
         *
         * @param {string} objectId
         * @param {string} folderId
         * @param {boolean} [allVersions=false]
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        addObjectToFolder(objectId, folderId, allVersions = false, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'addObjectToFolder';
            o.allVersions = allVersions;
            o.folderId = folderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * Removes specified object from folder
         *
         * @param {string} objectId
         * @param {string} folderId
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        removeObjectFromFolder(objectId, folderId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.cmisaction = 'removeObjectFromFolder';
            o.folderId = folderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * gets object relationships
         *
         * @param {string} objectId
         * @param {boolean} [includeSubRelationshipTypes=false]
         * @param {string} [relationshipDirection]
         * @param {string} [typeId]
         * @param {{
         *         maxItems?: number,
         *         skipCount?: number,
         *         includeAllowableActions?: boolean,
         *         filter?: string,
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        getObjectRelationships(objectId, includeSubRelationshipTypes = false, relationshipDirection, typeId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.includeSubRelationshipTypes = includeSubRelationshipTypes;
            o.relationshipDirection = relationshipDirection || 'either';
            if (typeId) {
                o.typeId = typeId;
            }
            o.cmisselector = 'relationships';
            return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * applies policy to object
         *
         * @param {string} objectId
         * @param {string} policyId
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        applyPolicy(objectId, policyId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.policyId = policyId;
            o.cmisaction = 'applyPolicy';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * removes policy from object
         *
         * @param {string} objectId
         * @param {string} policyId
         * @param {{
         *         succinct?: boolean
         *       }} [options={}]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        removePolicy(objectId, policyId, options = {}) {
            let o = options;
            o.objectId = objectId;
            o.policyId = policyId;
            o.cmisaction = 'removePolicy';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
        }
        ;
        /**
         * applies ACL to object
         *
         * @param {string} objectId
         * @param {{ [k: string]: string }} [addACEs]
         * @param {{ [k: string]: string }} [removeACEs]
         * @param {string} [propagation]
         * @returns {Promise<any>}
         *
         * @memberof CmisSession
         */
        applyACL(objectId, addACEs, removeACEs, propagation) {
            let options = new Options();
            options.objectId = objectId;
            options.cmisaction = 'applyACL';
            options.propagation = propagation;
            if (addACEs) {
                this.setACEs(options, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(options, removeACEs, 'remove');
            }
            return this.post(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
        }
        ;
    }
    cmis.CmisSession = CmisSession;
})(cmis = exports.cmis || (exports.cmis = {}));
//# sourceMappingURL=cmis.js.map
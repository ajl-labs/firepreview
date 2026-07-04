export namespace database {
	
	export class CollectionDocFieldInfo {
	    name: string;
	    type: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new CollectionDocFieldInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.count = source["count"];
	    }
	}
	export class CollectionInfo {
	    id: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new CollectionInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.path = source["path"];
	    }
	}
	export class ConnectionConfig {
	    projectId: string;
	    credentialsPath: string;
	    useEmulator: boolean;
	    emulatorHost: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.credentialsPath = source["credentialsPath"];
	        this.useEmulator = source["useEmulator"];
	        this.emulatorHost = source["emulatorHost"];
	    }
	}
	export class DocumentResult {
	    id: string;
	    path: string;
	    fields: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new DocumentResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.path = source["path"];
	        this.fields = source["fields"];
	    }
	}
	export class QueryParams {
	    limit: number;
	    docId: string;
	    query: string;
	    direction: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.limit = source["limit"];
	        this.docId = source["docId"];
	        this.query = source["query"];
	        this.direction = source["direction"];
	    }
	}
	export class QueryResult {
	    documents: DocumentResult[];
	    total: number;
	    fields: CollectionDocFieldInfo[];
	    page: number;
	    pageSize: number;
	    totalPages: number;
	    nextCursor?: string;
	    prevCursor?: string;
	    hasNext: boolean;
	    hasPrev: boolean;
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.documents = this.convertValues(source["documents"], DocumentResult);
	        this.total = source["total"];
	        this.fields = this.convertValues(source["fields"], CollectionDocFieldInfo);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.totalPages = source["totalPages"];
	        this.nextCursor = source["nextCursor"];
	        this.prevCursor = source["prevCursor"];
	        this.hasNext = source["hasNext"];
	        this.hasPrev = source["hasPrev"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}


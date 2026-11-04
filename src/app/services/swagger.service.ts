import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn:'root'
})

export class swagger {
    private http = inject(HttpClient)
    private apiUrl = environment.serverURL;

    fetchAPIdocs() {
        return this.http.get(`${this.apiUrl}/api-json`)
    }
}
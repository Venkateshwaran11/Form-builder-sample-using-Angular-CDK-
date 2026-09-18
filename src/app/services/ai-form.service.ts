import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AIValidation {
    type:
    | 'required'
    | 'email'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'pattern';

    value?: string | number | null;
}

export interface AIFormField {
    type: string;
    name: string;
    label: string;
    value?: string | number | boolean | null;
    placeholder?: string | null;
    required: boolean;
    disabled: boolean;
    width: '100%' | '50%' | '33%' | '25%';
    options?: {
        label: string;
        value: string | number | boolean;
    }[];
    validations?: AIValidation[];
}

export interface AIFormConfig {
    formName: string;
    fields: AIFormField[];
}

@Injectable({
    providedIn: 'root'
})
export class AiFormService {

    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api/AI';

    generateForm(prompt: string, currentForm?: AIFormConfig): Observable<AIFormConfig> {
        return this.http.post<AIFormConfig>(`${this.apiUrl}/generate-form`,
            {
                prompt,
                currentForm
            }
        );
    }
}
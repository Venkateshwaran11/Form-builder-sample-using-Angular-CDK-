import { Component, OnInit } from '@angular/core';
// @ts-ignore
import SwaggerUI from 'swagger-ui-dist';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-swagger',
  standalone: true,
  template: `<div class="swagger-wrapper"><div id="swagger-ui"></div></div>`,
  styleUrl: './swagger.component.css'
})
export class SwaggerComponent implements OnInit {
  ngOnInit(): void {
    const apiDocsUrl = environment.apiUrl.replace(/\/api\/?$/, '/api-json');

    SwaggerUI.SwaggerUIBundle({
      url: apiDocsUrl,
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUI.SwaggerUIBundle.presets.apis,
        SwaggerUI.SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout'
    });
  }
}
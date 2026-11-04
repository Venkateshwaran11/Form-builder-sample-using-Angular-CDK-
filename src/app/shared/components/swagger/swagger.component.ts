import { Component, OnInit } from '@angular/core';
// @ts-ignore
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';
// @ts-ignore
import SwaggerUIStandalonePreset from 'swagger-ui-dist/swagger-ui-standalone-preset';
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

    SwaggerUIBundle({
      url: apiDocsUrl,
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout'
    });
  }
}

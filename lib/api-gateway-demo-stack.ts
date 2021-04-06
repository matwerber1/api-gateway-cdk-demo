import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import * as fs from 'fs';

function getVTLTemplateAsString(filename: string): string {
  var fileContents = fs.readFileSync('./lib/vtl/' + filename).toString()  
  return fileContents;
}

export class ApiGatewayDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //-----------------------------------------------------------------------------------
    // API Gateway REST API
    //-----------------------------------------------------------------------------------

    const api = new apigateway.RestApi(this, 'demo-api', {
      deploy: true,   // automatically deploy changes (for test purposes!)
      endpointConfiguration: {
        types: [
          apigateway.EndpointType.REGIONAL
        ]
      }
    });

    //-----------------------------------------------------------------------------------
    // UC-0 - Mock Integration
    //
    // This implements the demo from the API Gateway docs below: 
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-mock-integration-console.html
    //-----------------------------------------------------------------------------------

    const uc0 = api.root.addResource("uc0");
    uc0.addMethod('GET', new apigateway.MockIntegration({
        requestTemplates: {
          "application/json": getVTLTemplateAsString('uc0-integ-req-json.vtl')
        },
        integrationResponses: [
          {
            statusCode: "500",
            selectionPattern: "5\d{2}",    // Match any 5xx error
            responseTemplates: {
              "application/json": getVTLTemplateAsString('uc0-integ-res-json-200.vtl')
            }
          },
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": getVTLTemplateAsString('uc0-integ-res-json-500.vtl')
            }
          }
        ]
      },
    ), 
    { // Method Options
      requestParameters: {  // maps to Method Request
        "method.request.querystring.scope": false
     },
     methodResponses: [
        {
          statusCode: "500",
        },
        {
          statusCode: "200"
        }
     ]
    }
    );

    //-----------------------------------------------------------------------------------
    // UC-1 - Lambda Proxy
    //
    // This is a demo of the "Lambda Proxy" integration, which means that API Gateway
    // sends the original, unmodified request to Lambda and passes back the unmodified
    // response back to the requestor. 
    // The "Integration request" and "Integration response" sections are not used
    // with this type of request, but you can still use the "Method request" and
    // "Method response" sections.
    //
    // This section is not fully baked yet.  
    //-----------------------------------------------------------------------------------

    const uc1Function = new lambda.Function(this, 'UC1Function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/uc1')),
    });

    const uc1 = api.root.addResource('uc1');
    uc1.addMethod('GET', new apigateway.LambdaIntegration(uc1Function, {
        proxy: true,
        credentialsPassthrough: false,    // "Invoke with caller credentials" option
        //credentialsRole: xxx            // Execution role
      }), 
      
      { // Method Options
        requestParameters: {  // maps to Method Request
          "method.request.header.myHeader": false,
          "method.request.querystring.myQueryParam": false
       },
       
      }
    );

  }
}

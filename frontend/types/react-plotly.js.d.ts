declare module "react-plotly.js" {
  import * as React from "react";

  export interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    // možeš dodati i ostale props ako koristiš
  }

  export default class Plot extends React.Component<PlotParams, any> {}
}

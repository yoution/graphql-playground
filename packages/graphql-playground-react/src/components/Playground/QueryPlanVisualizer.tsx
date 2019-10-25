import * as React from 'react'
import { connect } from 'react-redux'
import { styled } from '../../styled'
import {
  getQueryPlan,
  getIsQueryPlanSupported,
} from '../../state/sessions/selectors'
import { queryPlanToMermaid } from '../../utils/queryPlanToMermaid'

// For backwards compatibility with _however_ they're packaging mermaid these days
const mermaid = require('mermaid')

export interface Props {
  value: string
  isQueryPlanSupported: boolean
}

export class QueryPlanVis extends React.Component<Props, {}> {
  private node: any
  public ref: any
  // private viewer: any

  getWidth(props: any = this.props) {
    // if (this.node && this.node.clientWidth) {
    //   return this.node.clientWidth;
    // }
    return window.innerWidth / 2;
  }

  componentDidMount() {
    console.dir(mermaid)
    mermaid
      ? mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          flowchart: {
            curve: 'basis',
          },
        })
      : true
  }

  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value
  }

  componentDidUpdate = () => {
    // const value = this.props.value || '';

    const graphDefinition = queryPlanToMermaid(this.props.value)
    if (graphDefinition) {
      mermaid.render('queryPlanGraph', graphDefinition, svgCode => {
        this.node.innerHTML = svgCode
      })
    }
  }

  componentWillUnmount() {}

  setRef = ref => {
    this.node = ref
    this.ref = ref
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this.node && this.node.clientHeight
  }

  render() {
    return this.props.isQueryPlanSupported || this.props.value ? (
      <QueryPlanMermaid id="mermaidQueryPlan" ref={this.setRef} />
    ) : (
      <NotSupported>
        This GraphQL server either doesn't support Apollo Federation, or the
        query plan extensions is disabled. See the{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.apollographql.com/docs/apollo-server/federation/introduction"
        >
          docs
        </a>{' '}
        for setting up query plan viewing with Apollo Federation.
      </NotSupported>
    )
  }
}

const QueryPlanMermaid = styled('div')`
color: rgb(0, 0, 0);
font: 16px / 24px "Open Sans", sans-serif;
display: block;
position: relative;
width: 50vw;
height: 100vh;
`

const NotSupported = styled.div`
  padding: 6px 25px 0;
  font-size: 14px;
  color: rgba(241, 143, 1, 1);
`
const mapStateToProps = state => ({
  value: getQueryPlan(state),
  isQueryPlanSupported: getIsQueryPlanSupported(state),
});

export const QueryPlanVisualizer = connect(mapStateToProps, null, null, { withRef: true })(QueryPlanVis)

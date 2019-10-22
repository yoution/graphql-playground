/*
    __queryPlanExperimental: "QueryPlan {↵  Sequence {↵    Fetch(service: "accounts") {↵      {↵        me {↵          name↵          __typename↵          id↵        }↵      }↵    },↵    Flatten(path: "me") {↵      Fetch(service: "reviews") {↵        {↵          ... on User {↵            __typename↵            id↵          }↵        } =>↵        {↵          ... on User {↵            reviews {↵              product {↵                upc↵                __typename↵              }↵            }↵          }↵        }↵      },↵    },↵    Flatten(path: "me.reviews.@.product") {↵      Fetch(service: "products") {↵        {↵          ... on Product {↵            __typename↵            upc↵          }↵        } =>↵        {↵          ... on Product {↵            name↵            price↵          }↵        }↵      },↵    },↵  },↵}"
*/

interface QueryPlan {
  kind: 'QueryPlan'
  node: PlanNode
}

type PlanNode = SequenceNode | ParallelNode | FetchNode | FlattenNode

interface SequenceNode {
  kind: 'Sequence'
  nodes: PlanNode[]
}

interface ParallelNode {
  kind: 'Parallel'
  nodes: PlanNode[]
}

interface FetchNode {
  kind: 'Fetch'
  serviceName: string
  selectionSet: []
  variableUsages?: { [name: string]: any }
  requires?: []
}

interface FlattenNode {
  kind: 'Flatten'
  path: string[]
  node: PlanNode
}

interface nodeFormatterInput {
  lastNodeHash: string
  currentNode: PlanNode
}

interface nodeFormatterOutput {
  mermaid: string
  lastNodeHash: string
}

const nodeFormatters = {
  Sequence: ({
    lastNodeHash,
    currentNode,
  }: nodeFormatterInput): nodeFormatterOutput => {
    // Sequence handles child nodes by passing the last node to each of the subsequent
    // nodes.
    let mermaid = ''
    const thisNodeHash = hash()

    // Setup our node in Mermaid, then link to the previous graph node
    mermaid = `
            ${thisNodeHash}["Sequence"]
            ${lastNodeHash} --> ${thisNodeHash}
            `

    // For each of the `nodes`, process and format, using the previous hash instead of the root
    let tieToPreviousHash = thisNodeHash
    ;(currentNode as SequenceNode).nodes.forEach((current: PlanNode) => {
      const nextNode = process(current)({
        lastNodeHash: tieToPreviousHash,
        currentNode: current,
      })
      tieToPreviousHash = nextNode.lastNodeHash
      mermaid += nextNode.mermaid
    })

    return { lastNodeHash: thisNodeHash, mermaid }
  },
  Fetch: ({
    lastNodeHash,
    currentNode,
  }: nodeFormatterInput): nodeFormatterOutput => {
    const currentNodeHash = hash()

    //                 ${currentNodeHash} --> ${hash()}["${(currentNode as FetchNode).selectionSet ? (currentNode as FetchNode).selectionSet.join(',') : "No selection"}"]

    return {
      lastNodeHash: currentNodeHash,
      mermaid: `
                ${currentNodeHash}["${currentNode.kind} (${
        (currentNode as FetchNode).serviceName
      })"]
                ${lastNodeHash} --> ${currentNodeHash}
            `,
    }
  },
  Flatten: ({
    lastNodeHash,
    currentNode,
  }: nodeFormatterInput): nodeFormatterOutput => {
    const currentNodeHash = hash()
    const childOutput = process((currentNode as FlattenNode).node)({
      lastNodeHash: currentNodeHash,
      currentNode: (currentNode as FlattenNode).node,
    })

    return {
      lastNodeHash: childOutput.lastNodeHash,
      mermaid:
        `
                ${currentNodeHash}["${
          currentNode.kind
        } (${(currentNode as FlattenNode).path.join(',')})"]
                ${lastNodeHash} --> ${currentNodeHash}
            ` + childOutput.mermaid,
    }
  },
}

function hash(): string {
  return Date.now() + Math.random().toString()
}

function process(
  currentNode: PlanNode,
): ({ lastNodeHash, currentNode }: nodeFormatterInput) => nodeFormatterOutput {
  return nodeFormatters[currentNode.kind] || []
}

export function queryPlanToMermaid(serializedQueryPlan: string) {
  if (!serializedQueryPlan) return

  let queryPlan: QueryPlan
  try {
    queryPlan = JSON.parse(serializedQueryPlan)
  } catch (error) {
    console.error('Unable to parse queryPlan')
    console.dir(serializedQueryPlan)
    console.dir(error)
    return
  }

  console.dir(queryPlan)
  const rootNodeHash = hash()
  try {
    const graphSyntaxObjects: nodeFormatterOutput = process(queryPlan.node)({
      lastNodeHash: rootNodeHash,
      currentNode: queryPlan.node,
    })
    const graphOutput = `
      graph LR
          ${rootNodeHash}['Query Plan']
          ${graphSyntaxObjects.mermaid}
      `

    console.dir(graphOutput)
    return graphOutput
  } catch (error) {
    console.error(error)
    return ''
  }
}

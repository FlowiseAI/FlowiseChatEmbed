import { createSignal, Show, For } from 'solid-js';
import { WorkflowTreeView, type WorkflowNode } from './WorkflowTreeView';

type DataTransformerProps = {
  jsonData: string;
  class?: string;
};

export const DataTransformer = (props: DataTransformerProps) => {
  const [parsedData, setParsedData] = createSignal<WorkflowNode[]>([]);
  const [error, setError] = createSignal<string | null>(null);
  const [indentation, setIndentation] = createSignal(24);

  const transformData = () => {
    try {
      // Parse the JSON string into an object
      const rawData = JSON.parse(props.jsonData);

      // Check if it's an array
      if (!Array.isArray(rawData)) {
        setError('Input must be a JSON array');
        return;
      }

      // Transform the data into the format needed by WorkflowTreeView
      const transformedData: WorkflowNode[] = rawData.map((node) => ({
        nodeId: node.nodeId,
        nodeLabel: node.nodeLabel,
        data: node.data,
        previousNodeIds: node.previousNodeIds || [],
        // Map the status, defaulting to PENDING if not valid
        status: ['FINISHED', 'PENDING', 'RUNNING', 'ERROR'].includes(node.status)
          ? (node.status as 'FINISHED' | 'PENDING' | 'RUNNING' | 'ERROR')
          : 'PENDING',
      }));

      setParsedData(transformedData);
      setError(null);
    } catch (e) {
      setError(`Error parsing JSON: ${e instanceof Error ? e.message : String(e)}`);
      setParsedData([]);
    }
  };

  const handleIndentationChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setIndentation(parseInt(target.value));
  };

  // Transform the data on component load
  if (props.jsonData && !parsedData().length && !error()) {
    transformData();
  }

  return (
    <div class={props.class || ''}>
      <h2 class="text-xl font-semibold mb-4">Workflow Visualization</h2>

      <Show when={error()}>
        <div class="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">Error: {error()}</div>
      </Show>

      <Show when={!error() && parsedData().length > 0}>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Indentation Level: {indentation()}px</label>
          <input type="range" min="8" max="48" step="4" value={indentation()} onInput={handleIndentationChange} class="w-64" />
        </div>

        <WorkflowTreeView workflowData={parsedData()} indentationLevel={indentation()} />
      </Show>

      <Show when={!error() && parsedData().length === 0}>
        <div class="p-3 mb-4 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded">No workflow data found or data is empty.</div>
      </Show>
    </div>
  );
};

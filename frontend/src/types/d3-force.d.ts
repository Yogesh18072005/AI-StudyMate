declare module "d3-force" {
    export interface SimulationNodeDatum {
        index?: number;
        x?: number;
        y?: number;
        vx?: number;
        vy?: number;
        fx?: number | null;
        fy?: number | null;
    }

    export interface Simulation<NodeDatum extends SimulationNodeDatum> {
        nodes(nodes: NodeDatum[]): this;
        force(name: string, force: unknown): this;
        alpha(value: number): this;
        alphaDecay(value: number): this;
        alphaTarget(value: number): this;
        on(typ: string, listener: (this: this) => void): this;
        restart(): this;
        stop(): this;
    }

    export function forceSimulation<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(
        nodes?: NodeDatum[]
    ): Simulation<NodeDatum>;
    export function forceManyBody(): unknown;
    export function forceLink(links?: unknown[]): unknown;
    export function forceCollide(radius?: number): unknown;
    export function forceRadial(radius: number, x?: number, y?: number): unknown;
}

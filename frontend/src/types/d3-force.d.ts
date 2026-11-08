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

    export interface Force<NodeDatum extends SimulationNodeDatum> {
        (alpha: number): void;
        initialize?(nodes: NodeDatum[], random: () => number): void;
        strength?(value: number): Force<NodeDatum>;
    }

    export interface Simulation<NodeDatum extends SimulationNodeDatum> {
        nodes(nodes: NodeDatum[]): this;
        force(name: string, force: Force<NodeDatum> | null): this;
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
    export function forceManyBody<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(): Force<NodeDatum>;
    export function forceLink<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(links?: unknown[]): Force<NodeDatum>;
    export function forceCollide<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(radius?: number): Force<NodeDatum>;
    export function forceRadial<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(
        radius: number,
        x?: number,
        y?: number
    ): Force<NodeDatum>;
}

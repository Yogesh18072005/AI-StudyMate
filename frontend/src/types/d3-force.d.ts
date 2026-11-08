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
        strength(value: number): Force<NodeDatum>;
    }

    export interface Simulation<NodeDatum extends SimulationNodeDatum> {
        nodes(nodes: NodeDatum[]): this;
        force(name: string, force: Force<SimulationNodeDatum> | null): this;
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
    export function forceManyBody(): Force<SimulationNodeDatum>;
    export function forceLink(links?: unknown[]): Force<SimulationNodeDatum>;
    export function forceCollide(radius?: number): Force<SimulationNodeDatum>;
    export function forceRadial(
        radius: number,
        x?: number,
        y?: number
    ): Force<SimulationNodeDatum>;
}

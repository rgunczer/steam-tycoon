import * as THREE from "./vendor/three.module.min.js";

const size = 8;
const levels = [
  {
    name: "Flywheel",
    view: [42, 50],
    action: "spinning",
    source: [0, 5],
    destination: [7, 1],
    obstacles: [[4, 5], [4, 3], [5, 4], [3, 0], [4, 7], [6, 2], [2, 6]],
    build: buildFlywheel,
  },
  {
    name: "Ventilation fan",
    view: [-39, 54],
    action: "ventilating",
    source: [0, 1],
    destination: [7, 5],
    obstacles: [
      [4, 0], [4, 1], [4, 2], [4, 4], [4, 7], [1, 4],
      [3, 0], [6, 2], [2, 6],
    ],
    build: buildFan,
  },
  {
    name: "Steam press",
    view: [44, 53],
    action: "stamping",
    source: [0, 7],
    destination: [7, 0],
    obstacles: [
      [4, 7], [2, 4], [2, 3], [5, 6], [5, 4], [5, 3],
      [5, 1], [3, 0], [6, 2],
    ],
    build: buildPress,
  },
  {
    name: "Split shift",
    view: [-42, 57],
    source: [0, 2],
    junctions: ["tee"],
    obstacles: [[2, 1], [4, 4], [5, 4], [1, 5], [4, 7], [3, 0], [2, 6]],
    fixed: [[4, 2, "straight", 0], [2, 5, "elbow", 3]],
    receivers: [
      {"position":[7, 2], "build":buildFlywheel},
      {"position":[7, 5], "build":buildFan},
    ],
  },
  {
    name: "Cross pressure",
    view: [40, 59],
    source: [0, 3],
    junctions: ["tee", "cross"],
    obstacles: [
      [1, 2], [1, 4], [4, 0], [4, 4], [6, 4], [4, 7],
      [3, 0], [2, 6],
    ],
    fixed: [[3, 2, "elbow", 0], [4, 3, "straight", 0], [3, 4, "straight", 1], [4, 5, "straight", 0]],
    receivers: [
      {"position":[7, 2], "build":buildFan},
      {"position":[7, 3], "build":buildFlywheel},
      {"position":[7, 5], "build":buildPress},
    ],
  },
  {
    name: "Factory manifold",
    view: [-44, 61],
    source: [0, 4],
    junctions: ["tee", "cross"],
    obstacles: [
      [1, 3], [1, 6], [4, 3], [5, 3], [5, 6], [2, 0],
      [5, 0], [3, 0], [6, 2],
    ],
    fixed: [[2, 3, "straight", 1], [4, 1, "straight", 0], [5, 4, "straight", 0], [4, 7, "elbow", 3], [2, 6, "straight", 1]],
    receivers: [
      {"position":[7, 1], "build":buildFan},
      {"position":[7, 4], "build":buildFlywheel},
      {"position":[7, 7], "build":buildPress},
      {"position":[2, 7], "port":3, "build":buildFan},
    ],
  },
  {
    name: "First rise",
    view: [-34, 55],
    source: [0, 4],
    destination: [7, 4],
    machineName: "Flywheel",
    action: "spinning",
    build: buildFlywheel,
    obstacles: [[3, 0], [4, 7], [6, 2], [2, 6]],
    terrain: [[4, 0, 1, "wall"], [4, 1, 1, "wall"], [4, 3, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 6, 1, "wall"], [4, 2, 1, "wall"]],
    fixed: [[4, 4, "straight", 0]],
  },
  {
    name: "Upper gallery",
    view: [-36, 57],
    source: [0, 3],
    destination: [7, 3],
    machineName: "Twin compressor",
    action: "compressing",
    build: buildCompressor,
    obstacles: [[3, 0], [2, 6]],
    terrain: [
      [4, 0, 1, "wall"], [4, 2, 1, "wall"], [4, 3, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 1, "wall"],
      [6, 0, 2, "wall"], [6, 2, 2, "wall"], [6, 3, 2, "wall"], [6, 4, 2, "wall"], [6, 5, 2, "wall"], [6, 7, 2, "wall"],
      [7, 3, 2, "wall"], [5, 3, 2, "wall"], [4, 1, 1, "wall"], [4, 6, 1, "wall"], [6, 1, 2, "wall"], [6, 6, 2, "wall"],
    ],
    fixed: [[6, 3, "straight", 0]],
  },
  {
    name: "Casting yard",
    view: [38, 56],
    source: [0, 5],
    destination: [7, 4],
    machineName: "Steam press",
    action: "stamping",
    build: buildPress,
    bendRisers: true,
    terrain: [[3, 4, 1], [4, 4, 1], [5, 4, 1, "wall"]],
    fixed: [[4, 4, "straight", 0]],
    obstacles: [
      [4, 0], [4, 1], [4, 3], [4, 5], [4, 7], [3, 0],
      [6, 2], [2, 6],
    ],
  },
  {
    name: "Foundry steps",
    view: [-35, 60],
    source: [0, 5],
    destination: [7, 3],
    machineName: "Beam pump",
    action: "pumping",
    build: buildBeamPump,
    bendRisers: true,
    terrain: [[3, 4, 1], [3, 3, 2], [4, 3, 2], [6, 3, 1], [7, 3, 1], [5, 3, 2, "wall"]],
    obstacles: [
      [4, 4], [4, 5], [3, 1], [4, 1], [6, 1], [3, 0],
      [4, 7], [6, 2], [2, 6],
    ],
    fixed: [[6, 3, "riser", 2]],
  },
  {
    name: "Over the parapet",
    view: [-40, 61],
    source: [0, 5],
    destination: [7, 4],
    machineName: "Centrifugal governor",
    action: "regulating",
    build: buildGovernor,
    bendRisers: true,
    terrain: [
      [4, 0, 1, "wall"], [4, 1, 1, "wall"], [4, 3, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 1, "wall"], [4, 4, 2],
      [5, 4, 1], [7, 4, 1, "wall"], [6, 4, 1, "wall"], [4, 2, 1, "wall"], [4, 6, 1, "wall"],
    ],
    obstacles: [[3, 3], [5, 3], [5, 5], [3, 0], [6, 2], [2, 6]],
    fixed: [[4, 4, "elbow", 0], [5, 4, "riser", 2]],
  },
  {
    name: "Terraced works",
    view: [-43, 62],
    source: [0, 4],
    junctions: ["tee", "cross"],
    bendRisers: true,
    terrain: [
      [4, 0, 1, "wall"], [4, 1, 1, "wall"], [4, 3, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 2],
      [5, 7, 2], [7, 7, 2], [6, 7, 2, "wall"], [4, 6, 2, "wall"], [4, 2, 1, "wall"],
    ],
    obstacles: [[3, 3], [3, 5], [5, 3], [5, 5], [3, 0], [6, 2], [2, 6]],
    fixed: [[4, 7, "elbow", 3], [5, 7, "straight", 0]],
    receivers: [
      {"position":[7, 4], "build":buildFlywheel},
      {"position":[7, 7], "build":buildPress},
    ],
  },
  {
    name: "Watchmaker’s bench",
    view: [38, 48],
    source: [0, 3],
    destination: [7, 3],
    boiler: buildKettle,
    build: buildClockwork,
    machineName: "Clockwork escapement",
    action: "ticking",
    obstacles: [[2, 2], [4, 4], [3, 0], [4, 7], [6, 2], [2, 6]],
    fixed: [[4, 3, "straight", 0]],
    goal: "Follow the fixed fittings and bridge the gaps to set the clockwork ticking.",
  },
  {
    name: "Silk hoist",
    view: [-39, 51],
    source: [0, 1],
    destination: [7, 4],
    boiler: buildDuplexBoiler,
    build: buildHoist,
    machineName: "Silk hoist",
    action: "lifting",
    obstacles: [[4, 1], [4, 3], [3, 5], [3, 0], [4, 7], [6, 2], [2, 6]],
    fixed: [[3, 3, "straight", 1], [4, 4, "straight", 0]],
    goal: "Turn the line around the brass blocks and bring the hoist to life.",
  },
  {
    name: "Salon turbine",
    view: [44, 53],
    source: [0, 5],
    destination: [7, 1],
    boiler: buildKettle,
    build: buildTurbine,
    machineName: "Salon turbine",
    action: "turning",
    obstacles: [
      [4, 5], [4, 4], [4, 1], [5, 4], [3, 0], [4, 7],
      [6, 2], [2, 6],
    ],
    fixed: [[2, 4, "straight", 1]],
    goal: "Find a route through the dogleg to the turbine.",
  },
  {
    name: "Evening service",
    view: [-37, 55],
    source: [0, 4],
    boiler: buildDuplexBoiler,
    junctions: ["tee"],
    obstacles: [[4, 5], [5, 5], [3, 3], [3, 0], [6, 2], [2, 6]],
    fixed: [[3, 5, "straight", 1], [4, 7, "straight", 0]],
    receivers: [
      {"position":[7, 4], "build":buildClockwork},
      {"position":[7, 7], "build":buildHoist},
    ],
  },
  {
    name: "North gallery",
    view: [41, 57],
    source: [0, 4],
    boiler: buildKettle,
    junctions: ["tee"],
    obstacles: [
      [4, 5], [5, 4], [3, 0], [7, 1], [4, 0], [4, 7],
      [6, 2], [2, 6],
    ],
    fixed: [[4, 3, "elbow", 0], [4, 1, "straight", 0]],
    receivers: [
      {"position":[7, 3], "build":buildBeamPump},
      {"position":[7, 0], "build":buildTurbine},
    ],
  },
  {
    name: "Three commissions",
    view: [-43, 60],
    source: [0, 4],
    boiler: buildDuplexBoiler,
    junctions: ["tee", "cross"],
    obstacles: [
      [4, 2], [5, 2], [4, 7], [1, 5], [3, 0], [7, 5],
      [6, 2], [2, 6],
    ],
    fixed: [[5, 1, "straight", 0], [3, 2, "straight", 1], [5, 7, "elbow", 3]],
    receivers: [
      {"position":[7, 1], "build":buildClockwork},
      {"position":[7, 4], "build":buildHoist},
      {"position":[7, 7], "build":buildTurbine},
    ],
  },
  {
    name: "Brass footbridge",
    view: [34, 54],
    source: [0, 4],
    destination: [7, 3],
    boiler: buildKettle,
    build: buildHoist,
    machineName: "Footbridge hoist",
    action: "lifting",
    bendRisers: true,
    terrain: [[3, 3, 1], [4, 3, 1, "wall"]],
    obstacles: [
      [4, 0], [4, 1], [4, 4], [4, 5], [4, 7], [1, 3],
      [3, 0], [6, 2], [2, 6],
    ],
    fixed: [[4, 3, "straight", 0]],
    goal: "Climb around the corner, cross the footbridge, and descend to the hoist.",
  },
  {
    name: "Upper observatory",
    view: [-38, 57],
    source: [0, 5],
    destination: [7, 2],
    boiler: buildDuplexBoiler,
    build: buildClockwork,
    machineName: "Observatory clockwork",
    action: "ticking",
    bendRisers: true,
    terrain: [[4, 5, 1, "wall"], [4, 4, 2, "wall"], [4, 2, 2, "wall"], [5, 2, 2], [7, 2, 2], [6, 2, 2, "wall"], [4, 3, 2, "wall"]],
    obstacles: [
      [3, 4], [5, 4], [5, 5], [4, 1], [5, 1], [3, 0],
      [4, 7], [2, 6],
    ],
    fixed: [[5, 2, "straight", 0]],
    goal: "Climb two decks and turn along the upper ledge to reach the clockwork.",
  },
  {
    name: "Cascade",
    view: [41, 59],
    source: [0, 5],
    machineName: "Cascade turbine",
    action: "turning",
    bendRisers: true,
    terrain: [[4, 5, 1, "wall"], [4, 4, 2, "wall"], [4, 3, 2, "wall"], [5, 3, 1], [7, 3, 1], [6, 3, 1, "wall"]],
    obstacles: [
      [3, 4], [5, 5], [5, 4], [3, 3], [5, 1], [3, 0],
      [4, 7], [6, 2], [2, 6],
    ],
    fixed: [[4, 4, "straight", 1]],
    receivers: [
      {"position":[7, 5], "port":3, "build":buildTurbine},
    ],
    goal: "Climb over the crest and step down twice to meet the turbine’s north inlet.",
  },
  {
    name: "High and low",
    view: [-40, 60],
    source: [0, 4],
    boiler: buildDuplexBoiler,
    junctions: ["tee"],
    terrain: [
      [4, 0, 1, "wall"], [4, 1, 1, "wall"], [4, 3, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 1, "wall"],
      [5, 4, 1], [7, 4, 2], [6, 4, 2, "wall"], [4, 2, 1, "wall"], [4, 6, 1, "wall"],
    ],
    obstacles: [[3, 3], [3, 5], [5, 3], [5, 7], [3, 0], [6, 2], [2, 6]],
    fixed: [[4, 5, "elbow", 3]],
    receivers: [
      {"position":[7, 4], "build":buildClockwork},
      {"position":[7, 5], "build":buildTurbine},
    ],
    goal: "Split on the wall. Send one branch upstairs and the other down to the floor.",
  },
  {
    name: "The three decks",
    view: [41, 61],
    source: [0, 4],
    boiler: buildKettle,
    junctions: ["tee", "cross"],
    terrain: [
      [4, 0, 1, "wall"], [4, 2, 1, "wall"], [4, 3, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 2],
      [5, 7, 2], [7, 7, 2], [5, 2, 1], [7, 2, 2], [6, 7, 2, "wall"], [6, 2, 2, "wall"],
      [4, 6, 2, "wall"], [4, 1, 1, "wall"],
    ],
    obstacles: [[3, 3], [3, 5], [5, 3], [5, 5], [7, 5], [3, 0], [2, 6]],
    fixed: [[4, 2, "elbow", 0], [5, 7, "straight", 0]],
    receivers: [
      {"position":[7, 2], "build":buildClockwork},
      {"position":[7, 4], "build":buildTurbine},
      {"position":[7, 7], "build":buildHoist},
    ],
    goal: "Build a crossroads on the wall and feed three machines at different heights.",
  },
  {
    name: "The grand commission",
    view: [-44, 62],
    source: [0, 5],
    boiler: buildDuplexBoiler,
    junctions: ["tee", "cross"],
    terrain: [
      [4, 0, 1, "wall"], [4, 1, 1, "wall"], [4, 2, 1, "wall"], [4, 4, 1, "wall"], [4, 5, 1, "wall"], [4, 7, 1, "wall"],
      [5, 2, 1], [5, 5, 1], [7, 2, 2], [7, 5, 2], [4, 6, 1, "wall"], [6, 5, 2, "wall"],
      [4, 3, 1, "wall"], [6, 2, 2, "wall"],
    ],
    obstacles: [
      [1, 2], [3, 2], [3, 4], [5, 1], [5, 4], [3, 7],
      [7, 1], [7, 4], [3, 0], [2, 6],
    ],
    fixed: [[4, 4, "straight", 1], [4, 0, "elbow", 0]],
    receivers: [
      {"position":[7, 0], "build":buildBeamPump},
      {"position":[7, 2], "build":buildHoist},
      {"position":[7, 5], "build":buildTurbine},
      {"position":[7, 7], "build":buildClockwork},
    ],
    goal: "Link both junctions on the wall. Supply all four machines with every branch sealed.",
  },
  {
    name: "The copper bell",
    machineName: "Copper bell", action: "ringing",
    source: [0, 5],
    receivers: [
      {"position":[7, 3], "build":buildBell},
    ],
    obstacles: [[4, 4], [4, 5], [5, 4], [2, 3], [3, 2]],
    goal: "Send steam around the copper blocks until the bell rings.",
    view: [40, 53],
    boiler: buildKettle,
    fixed: [[3, 3, "elbow", 0], [5, 3, "straight", 0]],
  },
  {
    name: "The fountain key",
    machineName: "Fountain", action: "turning",
    source: [0, 2],
    receivers: [
      {"position":[7, 2], "build":buildFountain},
    ],
    obstacles: [[3, 2], [3, 3], [4, 2], [4, 4], [6, 3], [6, 5]],
    goal: "Wind through both fixed fittings to turn the fountain.",
    view: [-39, 53],
    boiler: buildDuplexBoiler,
    fixed: [[2, 4, "straight", 1], [5, 4, "straight", 1]],
  },
  {
    name: "Glasshouse shutters",
    source: [0, 4],
    receivers: [
      {"position":[7, 1], "build":buildShutters},
      {"position":[7, 6], "build":buildBell},
    ],
    obstacles: [[4, 3], [4, 4], [4, 5], [5, 2], [5, 5], [2, 6]],
    goal: "Split the line to open the shutters and ring the bell.",
    view: [40, 53],
    boiler: buildBoiler,
    fixed: [[3, 3, "straight", 1], [4, 6, "straight", 0]],
    junctions: ["tee"],
  },
  {
    name: "The music cabinet",
    source: [0, 3],
    receivers: [
      {"position":[7, 1], "build":buildCarillon},
      {"position":[7, 3], "build":buildBell},
      {"position":[7, 6], "build":buildShutters},
    ],
    obstacles: [[2, 1], [4, 2], [4, 4], [4, 6], [6, 4], [6, 5]],
    goal: "Use two junctions to feed all three mechanisms.",
    view: [-39, 53],
    boiler: buildKettle,
    fixed: [[4, 3, "straight", 0], [3, 2, "straight", 1], [5, 5, "straight", 1]],
    junctions: ["tee"],
  },
  {
    name: "The clockmaker’s loop",
    source: [0, 4],
    receivers: [
      {"position":[7, 4], "build":buildClockwork},
      {"position":[7, 6], "build":buildCarillon},
    ],
    obstacles: [[3, 2], [3, 3], [4, 3], [4, 5], [6, 2], [6, 5]],
    goal: "Close the upper loop and feed the music drum below it.",
    view: [40, 59],
    boiler: buildDuplexBoiler,
    fixed: [[4, 4, "straight", 0], [2, 2, "straight", 1], [4, 1, "straight", 0], [5, 2, "straight", 1]],
    junctions: ["tee", "cross"],
  },
  {
    name: "The raised fountain",
    machineName: "Fountain", action: "turning",
    source: [0, 5],
    receivers: [
      {"position":[7, 2], "build":buildFountain},
    ],
    terrain: [[4, 4, 1], [4, 3, 1], [4, 2, 1], [5, 2, 1], [6, 2, 1], [7, 2, 1]],
    obstacles: [[3, 3], [3, 4], [4, 6], [5, 4], [6, 4], [6, 1]],
    goal: "Climb onto the raised terrace and take the turn toward the fountain.",
    view: [-39, 59],
    boiler: buildBoiler,
    fixed: [[4, 3, "straight", 1], [5, 2, "straight", 0]],
    bendRisers: true,
  },
  {
    name: "The bell tower",
    machineName: "Tower bell", action: "ringing",
    source: [0, 6],
    receivers: [
      {"position":[7, 2], "build":buildBell},
    ],
    terrain: [
      [3, 5, 1], [3, 4, 1], [3, 3, 2], [3, 2, 2], [4, 2, 2], [5, 2, 2],
      [6, 2, 2], [7, 2, 2],
    ],
    obstacles: [[2, 3], [2, 4], [2, 5], [4, 4], [4, 5], [5, 1], [5, 3]],
    goal: "Climb two levels to reach the bell at the top of the tower.",
    view: [40, 59],
    boiler: buildKettle,
    fixed: [[3, 5, "straight", 1], [4, 2, "straight", 0], [6, 2, "straight", 0]],
    bendRisers: true,
  },
  {
    name: "The sluice gardens",
    source: [0, 3],
    receivers: [
      {"position":[7, 1], "build":buildShutters},
      {"position":[7, 6], "build":buildFountain},
    ],
    terrain: [[4, 3, 1], [4, 2, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1], [7, 1, 1], [4, 4, 1]],
    obstacles: [[3, 2], [3, 4], [3, 6], [5, 2], [5, 3], [5, 4], [6, 5]],
    goal: "Split on the terrace, then bring the lower branch back to the floor.",
    view: [-39, 59],
    boiler: buildDuplexBoiler,
    fixed: [[4, 2, "straight", 1], [5, 6, "straight", 0]],
    junctions: ["tee"],
  },
  {
    name: "The ascending song",
    source: [0, 5],
    receivers: [
      {"position":[7, 2], "build":buildCarillon},
      {"position":[7, 0], "build":buildBell},
    ],
    terrain: [
      [4, 4, 1], [4, 3, 1], [4, 2, 1], [5, 2, 1], [6, 2, 1], [7, 2, 1],
      [4, 0, 2], [5, 0, 2], [6, 0, 2], [7, 0, 2], [4, 1, 1],
    ],
    obstacles: [[3, 2], [3, 3], [3, 4], [5, 1], [5, 3], [6, 1], [6, 4]],
    goal: "Climb around the corner and send the upper branch up one more step.",
    view: [40, 59],
    boiler: buildBoiler,
    fixed: [[4, 3, "straight", 1], [6, 2, "straight", 0], [5, 0, "straight", 0]],
    junctions: ["tee"],
    bendRisers: true,
  },
  {
    name: "The four winds",
    source: [0, 3],
    receivers: [
      {"position":[7, 1], "build":buildShutters},
      {"position":[7, 3], "build":buildFountain},
      {"position":[7, 4], "build":buildCarillon},
      {"position":[7, 6], "build":buildBell},
    ],
    terrain: [
      [3, 3, 1], [3, 2, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1],
      [7, 1, 1], [3, 4, 1], [4, 3, 1], [5, 3, 1], [5, 4, 1],
    ],
    obstacles: [
      [2, 2], [2, 4], [2, 6], [4, 2], [4, 4], [4, 5],
      [6, 2], [6, 5],
    ],
    goal: "Build a crossroads on the raised deck, then split again to supply four machines.",
    view: [-39, 59],
    boiler: buildKettle,
    fixed: [[4, 3, "straight", 0], [3, 2, "straight", 1], [5, 1, "straight", 0], [3, 5, "riser", 3]],
    junctions: ["tee", "cross"],
  },
  {
    name: "The inverted gallery",
    source: [0, 5],
    receivers: [
      {"position":[7, 2], "build":buildGovernor},
      {"position":[7, 5], "build":buildShutters},
      {"position":[7, 0], "build":buildCarillon},
    ],
    terrain: [
      [2, 4, 1], [2, 3, 1], [2, 2, 2], [3, 2, 2], [4, 2, 2], [5, 2, 2],
      [6, 2, 2], [7, 2, 2], [4, 3, 1], [4, 4, 1], [4, 5, 1], [4, 1, 2],
      [4, 0, 1],
    ],
    obstacles: [
      [1, 3], [3, 3], [3, 4], [3, 5], [5, 1], [5, 3],
      [5, 4], [6, 4],
    ],
    goal: "From the upper crossroads, step down twice on one branch and turn down onto the lower gallery on the other.",
    view: [40, 59],
    boiler: buildDuplexBoiler,
    fixed: [[2, 4, "straight", 1], [3, 2, "straight", 0], [4, 4, "straight", 1], [5, 5, "riser", 2], [6, 0, "straight", 0]],
    junctions: ["cross"],
    bendRisers: true,
  },
  {
    name: "The royal recital",
    source: [0, 4],
    receivers: [
      {"position":[7, 4], "build":buildFountain},
      {"position":[7, 1], "build":buildBell},
      {"position":[7, 7], "build":buildShutters},
      {"position":[7, 2], "build":buildCarillon},
    ],
    terrain: [
      [3, 4, 1], [4, 4, 1], [5, 4, 2], [6, 4, 2], [7, 4, 2], [3, 3, 1],
      [3, 2, 1], [3, 1, 2], [4, 1, 2], [5, 1, 2], [6, 1, 2], [7, 1, 2],
      [3, 5, 1], [5, 3, 1], [5, 2, 1], [6, 2, 1], [7, 2, 1],
    ],
    obstacles: [
      [2, 3], [2, 5], [2, 6], [4, 2], [4, 3], [4, 5],
      [4, 6], [5, 6], [6, 3], [6, 5], [7, 5],
    ],
    goal: "Work across both terraces and bring all four pieces of the recital to life.",
    view: [-39, 59],
    boiler: buildBoiler,
    fixed: [[6, 4, "straight", 0], [3, 3, "straight", 1], [4, 1, "straight", 0], [3, 6, "riser", 3], [6, 7, "straight", 0], [6, 2, "straight", 0]],
    junctions: ["tee", "cross"],
  },
  {
    name: "First fitting",
    tutorial: true,
    view: [42, 50],
    source: [0, 5],
    destination: [7, 1],
    machineName: "Flywheel",
    action: "spinning",
    build: buildFlywheel,
    obstacles: [[4, 3], [4, 5], [3, 0], [4, 7]],
    fixed: [
      [2, 4, "straight", 1], [2, 3, "straight", 1], [2, 1, "elbow", 0], [4, 1, "straight", 0], [5, 1, "straight", 0], [3, 1, "straight", 0],
      [2, 2, "straight", 1], [6, 1, "straight", 0],
    ],
    tutorialGap: [2, 5],
  },
];

const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const pipePorts = {
  straight: [0, 2], elbow: [0, 1], tee: [0, 1, 2], cross: [0, 1, 2, 3],
  riser: [2, 0], 'riser-elbow': [2, 3],
};
const rotationCount = { straight: 2, elbow: 4, tee: 4, cross: 1, riser: 4, 'riser-elbow': 4 };
const riseByPort = { riser: [0, 1], 'riser-elbow': [0, 1] };
const key = (x, z) => z * size + x;
const inside = (x, z) => x >= 0 && z >= 0 && x < size && z < size;
const world = n => n - (size - 1) / 2;
let level;
const pipeHeight = 0.27;
const heightStep = 0.68;
const maxHeight = 2;
const stage = document.querySelector('#stage');
const giftCase = document.querySelector('.gift-case');
const openBoxButton = document.querySelector('#open-box');
const drawerLatch = document.querySelector('#drawer-latch');
const drawerPanel = document.querySelector('#drawer-panel');
const drawerLabel = document.querySelector('#drawer-label');
const selectedTool = document.querySelector('#selected-tool');
const turnPiece = document.querySelector('#turn-piece');
const undoButton = document.querySelector('#undo');
const redoButton = document.querySelector('#redo');
const soundButton = document.querySelector('#sound');
const rewardPlate = document.querySelector('#reward-plate');
const rewardLabel = document.querySelector('#reward-label');
const rewardLatch = document.querySelector('#reward-latch');
let drawerOpen = false;
let drawerDiscovered = false;
const status = document.querySelector('#status');
const pressureMeter = document.querySelector('#pressure');
const pressureReadout = document.querySelector('#pressure-value');
const pressureHand = document.querySelector('#pressure-hand');

const scene = new THREE.Scene();
const tray = new THREE.Group();
scene.add(tray);
const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 40);
const viewDistance = 19;
let viewTurns = 0;
let overhead = false;
let orbitYaw = 0;
let orbitTilt = 0;
let viewZoom = 1;

let inspectingLid = false;
function aimCamera() {
  if (inspectingLid) {
    camera.position.set(0, 4.25, -0.55);
    camera.lookAt(0, 1.1, -5.21);
    camera.updateMatrixWorld();
    return;
  }
  const [heading, tilt] = level.view;
  const azimuth = THREE.MathUtils.degToRad(overhead ? 0 : heading + orbitYaw);
  const elevation = THREE.MathUtils.degToRad(overhead ? 89.99 : tilt + orbitTilt);
  camera.position.set(
    Math.sin(azimuth) * Math.cos(elevation) * viewDistance,
    Math.sin(elevation) * viewDistance,
    Math.cos(azimuth) * Math.cos(elevation) * viewDistance,
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
stage.append(renderer.domElement);

const reflectionCanvas = document.createElement('canvas');
reflectionCanvas.width = 256;
reflectionCanvas.height = 128;
const reflectionPaint = reflectionCanvas.getContext('2d');
reflectionPaint.fillStyle = '#373b39';
reflectionPaint.fillRect(0, 0, 256, 128);
for (const [x, y, radius, color] of [
  [54, 30, 57, '#ffd6ad'], [169, 36, 41, '#79a3b4'], [226, 42, 28, '#b7c5be'],
]) {
  const light = reflectionPaint.createRadialGradient(x, y, 2, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, 'transparent');
  reflectionPaint.fillStyle = light;
  reflectionPaint.fillRect(0, 0, 256, 128);
}
const reflection = new THREE.CanvasTexture(reflectionCanvas);
reflection.colorSpace = THREE.SRGBColorSpace;
reflection.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = reflection;
scene.environmentIntensity = 0.72;

scene.add(new THREE.HemisphereLight(0xc5cbea, 0x665043, 1.42));
const sun = new THREE.DirectionalLight(0xffc894, 3.38);
sun.position.set(-4, 7, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 20 });
sun.shadow.normalBias = 0.022;
sun.shadow.bias = -0.0002;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x9ca9f8, 1.25);
rim.position.set(3, 4, -6);
scene.add(rim);

function material(color, metalness = 0.35, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

const iron = material(0x51575a, 0.69, 0.39);
const pipeSteel = material(0x767c84, 0.77, 0.30);
const gasket = material(0x30241e, 0.32, 0.62);
const boilerCopper = material(0x9e532e, 0.72, 0.43);
const castSteel = material(0x635e58, 0.5, 0.67);
const bronze = material(0x946134, 0.69, 0.46);
const gaugeRed = new THREE.MeshStandardMaterial({
  color: 0xc62916, emissive: 0x7b180a, emissiveIntensity: 0.38, roughness: 0.55,
});
const frame = material(0x553423, 0.14, 0.57);
const velvet = material(0x141e47, 0.06, 0.96);
const enamelBlue = material(0x203866, 0.53, 0.36);
const dark = material(0x171c1b, 0.2);
const brass = material(0xd6a05b, 0.76, 0.28);
const machineEnamel = material(0x273c60, 0.48, 0.40);
const wallFinish = material(0x534b43, 0.42, 0.7);
const platformFinish = material(0x475d59, 0.42, 0.62);
const deckFinish = material(0x776655, 0.38, 0.72);
const riserFinish = material(0x995d38, 0.62, 0.43);
const fixedPipeFinish = material(0x468e9f, 0.48, 0.4);
const collarActive = brass.clone();
collarActive.emissive.setHex(0x9c470c);
collarActive.emissiveIntensity = 0.58;
const machineryRed = material(0x98412d, 0.48, 0.48);
const rivetGeometry = new THREE.SphereGeometry(0.022, 8, 6);
const boltGeometry = new THREE.CylinderGeometry(0.047, 0.047, 0.035, 6);

function mesh(geometry, finish, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, finish);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, finish, w, h, d, x, y, z) {
  return mesh(new THREE.BoxGeometry(w, h, d), finish, parent, x, y, z);
}

const beveledParts = new Map();

function castBlock(parent, finish, w, h, d, x, y, z, bevel) {
  const dimensions = [w, h, d, bevel].join(',');
  if (!beveledParts.has(dimensions)) {
    const halfWidth = w / 2 - bevel;
    const halfDepth = d / 2 - bevel;
    const shape = new THREE.Shape().moveTo(-halfWidth, -halfDepth).lineTo(halfWidth, -halfDepth)
      .lineTo(halfWidth, halfDepth).lineTo(-halfWidth, halfDepth).closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.center();
    beveledParts.set(dimensions, geometry);
  }
  return mesh(beveledParts.get(dimensions), finish, parent, x, y, z);
}

function cylinder(parent, finish, radius, length, x, y, z, axis = 'y') {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, length, 24), finish, parent, x, y, z);
  if (axis === 'x') object.rotation.z = Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

function atTile(x, z, parent, height = 0) {
  const group = new THREE.Group();
  group.position.set(world(x), height * heightStep, world(z));
  group.userData.position = [x, z];
  parent.add(group);
  return group;
}

function bolts(parent, spread, height) {
  for (const x of [-spread, spread]) {
    for (const z of [-spread, spread]) mesh(boltGeometry, brass, parent, x, height, z);
  }
}

const floor = mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.29 }), scene, 0, -1.71, 0);
floor.rotation.x = -Math.PI / 2;
floor.castShadow = false;
const boxWidth = 8.58;
const rimOffset = 0.67;
const plinth = material(0x281a17, 0.17, 0.58);
castBlock(tray, plinth, boxWidth + 0.13, 0.15, boxWidth + 0.13, 0, -0.71, 0, 0.046);
castBlock(tray, frame, boxWidth, 0.59, boxWidth, 0, -0.37, 0, 0.066);
castBlock(tray, velvet, size + 0.06, 0.16, size + 0.06, 0, -0.122, 0, 0.036);

const filigree = new THREE.Shape();
filigree.moveTo(0, -0.094);
filigree.quadraticCurveTo(-0.024, -0.064, -0.017, -0.027);
filigree.bezierCurveTo(-0.06, -0.103, -0.098, -0.002, -0.045, 0.014);
filigree.quadraticCurveTo(-0.063, -0.031, -0.015, -0.002);
filigree.bezierCurveTo(-0.026, 0.033, -0.019, 0.052, 0, 0.09);
filigree.bezierCurveTo(0.019, 0.052, 0.026, 0.033, 0.015, -0.002);
filigree.quadraticCurveTo(0.063, -0.031, 0.045, 0.014);
filigree.bezierCurveTo(0.098, -0.002, 0.06, -0.103, 0.017, -0.027);
filigree.quadraticCurveTo(0.024, -0.064, 0, -0.094);
filigree.closePath();
const crestGeometry = new THREE.ExtrudeGeometry(filigree, {
  depth: 0.009, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1,
});
const lidHinge = new THREE.CylinderGeometry(0.048, 0.048, 0.17, 16);
const inlay = material(0xc99755, 0.63, 0.34);
for (let side = 0; side < 4; side++) {
  const rail = new THREE.Group();
  rail.rotation.y = side * Math.PI / 2;
  tray.add(rail);
  castBlock(rail, frame, boxWidth, 0.30, 0.24, 0, -0.105, 3.496 + rimOffset, 0.042);
  for (const z of [4.054, 4.237]) {
    box(rail, inlay, size + 0.12, 0.014, 0.020, 0, 0.048, z);
  }
  for (const y of [-0.265, -0.548]) {
    box(rail, bronze, boxWidth - 0.26, 0.017, 0.018, 0, y, 3.627 + rimOffset);
  }
  for (const x of [-1.35, 1.35]) {
    castBlock(rail, brass, 0.37, 0.17, 0.049, x, -0.206, 3.636 + rimOffset, 0.022);
    const knuckle = mesh(lidHinge, bronze, rail, x, -0.121, 3.649 + rimOffset);
    knuckle.rotation.z = Math.PI / 2;
    for (const dx of [-0.115, 0.115]) mesh(rivetGeometry, bronze, rail, x + dx, -0.22, 3.664 + rimOffset);
  }
  const badge = new THREE.Group();
  badge.position.set(0, -0.395, 3.635 + rimOffset);
  rail.add(badge);
  const escutcheon = castBlock(badge, bronze, 0.36, 0.216, 0.046, 0, 0, 0, 0.018);
  escutcheon.rotation.z = Math.PI / 4;
  mesh(new THREE.CircleGeometry(0.142, 32), brass, badge, 0, 0, 0.027);
  mesh(new THREE.CircleGeometry(0.119, 32), enamelBlue, badge, 0, 0, 0.030);
  mesh(crestGeometry, inlay, badge, 0, 0.005, 0.034);
}
for (const x of [-4.16, 4.16]) {
  for (const z of [-4.16, 4.16]) {
    castBlock(tray, frame, 0.50, 0.17, 0.50, x * 0.86, -0.827, z * 0.86, 0.066);
    castBlock(tray, bronze, 0.52, 0.052, 0.52, x * 0.86, -0.87, z * 0.86, 0.022);
    castBlock(tray, brass, 0.34, 0.076, 0.34, x, 0.041, z, 0.028).rotation.y = Math.PI / 4;
    const crest = mesh(crestGeometry, enamelBlue, tray, x, 0.082, z);
    crest.rotation.set(-Math.PI / 2, 0, Math.atan2(x, z));
  }
}

const tiles = [];
const textureSize = 128;

function randomTextureSample() {
  let seed = 1837;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// A repeating noise field gives the castings uneven wear even when the UVs span several tiles.
function noiseField(columns, rows, random) {
  const grid = Array.from({ length: columns * rows }, random);
  return (u, v) => {
    const x = u * columns;
    const y = v * rows;
    const col = Math.floor(x);
    const row = Math.floor(y);
    const fx = x - col;
    const fy = y - row;
    const tx = fx * fx * (3 - 2 * fx);
    const ty = fy * fy * (3 - 2 * fy);
    const a = grid[row * columns + col];
    const b = grid[row * columns + (col + 1) % columns];
    const c = grid[((row + 1) % rows) * columns + col];
    const d = grid[((row + 1) % rows) * columns + (col + 1) % columns];
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
  };
}

function repeatingTexture(pixels) {
  const bytes = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  const texture = new THREE.DataTexture(bytes, textureSize, textureSize);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

function surfaceTexture(kind) {
  const random = randomTextureSample();
  const wear = noiseField(7, 7, random);
  const brushed = kind === 'brushed';
  const grain = brushed ? noiseField(3, 53, random) : noiseField(42, 42, random);
  const pixels = new Uint8ClampedArray(textureSize * textureSize * 4);
  const heights = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const u = x / textureSize;
      const v = y / textureSize;
      const tarnish = wear(u, v);
      const tooth = grain(u, v);
      const speck = random();
      const shade = kind === 'enamel'
        ? 211 + 31 * tarnish + 10 * tooth - (speck < 0.018 ? 70 : 0)
        : 195 + 36 * tarnish + 20 * tooth - (speck < 0.05 ? 47 : 0);
      const warmth = (1 - tarnish) * 11;
      const i = (y * textureSize + x) * 4;
      pixels.set([shade + warmth, shade, shade - warmth, 255], i);
      const pitting = speck < (brushed ? 0.018 : 0.047) ? 27 : 0;
      const relief = 134 + (tooth - 0.5) * (brushed ? 52 : 74) - pitting;
      heights.set([relief, relief, relief, 255], i);
    }
  }
  // Offset paired dark and bright strokes give scratches a lip that also catches the normal lighting.
  const scratchCount = brushed ? 105 : 37;
  for (let i = 0; i < scratchCount; i++) {
    const x = Math.floor(random() * textureSize);
    const y = Math.floor(random() * textureSize);
    const length = 3 + Math.floor(random() * (brushed ? 23 : 13));
    const slope = (random() - 0.5) * (brushed ? 0.08 : 1.2);
    for (let step = 0; step < length; step++) {
      const row = y + Math.round(step * slope);
      const col = (x + step) & (textureSize - 1);
      const wear = Math.sin(Math.PI * step / length) * (brushed ? 19 : 32);
      for (const [offset, amount] of [[0, -wear], [1, wear * 0.48]]) {
        const base = (((row + offset) & (textureSize - 1)) * textureSize + col) * 4;
        for (let channel = 0; channel < 3; channel++) {
          pixels[base + channel] += amount;
          heights[base + channel] += amount * (brushed ? 1.30 : 0.95);
        }
      }
    }
  }
  // Keep patina in the color and roughness maps while the height map carries scratches and pits.
  const roughness = repeatingTexture(pixels);
  const albedo = roughness.clone();
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.needsUpdate = true;
  return { map: albedo, bumpMap: repeatingTexture(heights), roughnessMap: roughness };
}

const castTexture = surfaceTexture('cast');
const brushedTexture = surfaceTexture('brushed');
const enamelTexture = surfaceTexture('enamel');
const tileFinishes = [0xe1cfb4, 0xd3bea2, 0xd9c6aa, 0xdecaad].map(color => material(color, 0.06, 0.70));

function makeWoodTextures() {
  const random = randomTextureSample();
  const rings = noiseField(7, 53, random);
  const shade = noiseField(4, 7, random);
  const pores = noiseField(13, 61, random);
  const pixels = new Uint8ClampedArray(textureSize * textureSize * 4);
  const heights = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const u = x / textureSize;
      const v = y / textureSize;
      const band = (v + 0.026 * Math.sin(u * Math.PI * 2) + 1) % 1;
      const grain = rings(u, band);
      const light = 145 + 62 * grain + 31 * shade(u, v);
      const relief = 132 + (grain - 0.5) * 88 - 39 * Math.pow(pores(u, band), 5);
      const index = (y * textureSize + x) * 4;
      pixels.set([light, light * 0.85, light * 0.73, 255], index);
      heights.set([relief, relief, relief, 255], index);
    }
  }
  const wood = repeatingTexture(pixels);
  wood.colorSpace = THREE.SRGBColorSpace;
  return { map: wood, bumpMap: repeatingTexture(heights) };
}

function makeTileTextures() {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  const ctx = tile.getContext('2d');
  const wash = ctx.createLinearGradient(11, 5, 242, 257);
  wash.addColorStop(0, '#f7ebd1');
  wash.addColorStop(0.55, '#ebdcc4');
  wash.addColorStop(1, '#d5bda0');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 256, 256);
  const random = randomTextureSample();
  for (let i = 0; i < 40; i++) {
    const x = random() * 256;
    const y = random() * 256;
    const radius = 12 + random() * 29;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, `rgba(94, 66, 44, ${random() * 0.12})`);
    stain.addColorStop(1, 'transparent');
    ctx.fillStyle = stain;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(102, 71, 47, ${random() * 0.12})`;
    ctx.fillRect(random() * 256, random() * 256, 2, 2);
  }
  paintTileEngraving(ctx, ['#8b694eac', '#9e765072', '#99744e9c', '#99744e78', '#916b4696']);
  const relief = document.createElement('canvas');
  relief.width = relief.height = 256;
  const reliefContext = relief.getContext('2d');
  const tooth = noiseField(47, 47, random);
  const heightField = reliefContext.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const height = 169 + 34 * tooth(x / 256, y / 256);
      heightField.data.set([height, height, height, 255], (y * 256 + x) * 4);
    }
  }
  reliefContext.putImageData(heightField, 0, 0);
  paintTileEngraving(reliefContext, ['#757575', '#9d9d9d', '#7a7a7a', '#919191', '#929292']);
  const albedo = new THREE.CanvasTexture(tile);
  albedo.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(relief);
  albedo.anisotropy = bumpMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return { map: albedo, bumpMap };
}

function paintTileEngraving(ctx, [edge, rule, scroll, stud, crest]) {
  ctx.save();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(13, 13, 230, 230);
  ctx.strokeStyle = rule;
  ctx.strokeRect(19, 19, 218, 218);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(i * Math.PI / 2);
    ctx.translate(-128, -128);
    ctx.strokeStyle = scroll;
    ctx.beginPath();
    ctx.moveTo(14, 57);
    ctx.bezierCurveTo(29, 45, 27, 26, 56, 15);
    ctx.moveTo(18, 46);
    ctx.bezierCurveTo(34, 39, 39, 35, 40, 18);
    ctx.moveTo(21, 36);
    ctx.bezierCurveTo(40, 30, 32, 21, 25, 24);
    ctx.stroke();
    ctx.fillStyle = stud;
    ctx.beginPath();
    ctx.ellipse(29, 40, 2, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.translate(128, 127);
  ctx.fillStyle = crest;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-13, 7, -21, -7, -12, -25);
  ctx.quadraticCurveTo(0, -40, 12, -25);
  ctx.bezierCurveTo(21, -7, 13, 7, 0, 20);
  ctx.moveTo(-4, 12);
  ctx.bezierCurveTo(-12, -1, -37, -17, -35, 3);
  ctx.quadraticCurveTo(-33, 16, -22, 11);
  ctx.quadraticCurveTo(-28, 2, -4, 12);
  ctx.moveTo(4, 12);
  ctx.bezierCurveTo(12, -1, 37, -17, 35, 3);
  ctx.quadraticCurveTo(33, 16, 22, 11);
  ctx.quadraticCurveTo(28, 2, 4, 12);
  ctx.fill();
  ctx.fillRect(-13, 14, 26, 4);
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.quadraticCurveTo(12, 25, 7, 29);
  ctx.quadraticCurveTo(1, 28, 0, 34);
  ctx.quadraticCurveTo(-1, 28, -7, 29);
  ctx.quadraticCurveTo(-12, 25, 0, 15);
  ctx.fill();
  ctx.restore();
}

const tileTexture = makeTileTextures();
for (const finish of tileFinishes) {
  Object.assign(finish, tileTexture, { roughnessMap: castTexture.roughnessMap, bumpScale: 0.019 });
}
for (const finish of [deckFinish, wallFinish, platformFinish, castSteel]) {
  Object.assign(finish, castTexture, { bumpScale: 0.022 });
}
Object.assign(frame, makeWoodTextures(), { bumpScale: 0.014 });
Object.assign(velvet, enamelTexture, { bumpScale: 0.024 });
Object.assign(boilerCopper, castTexture, { bumpScale: 0.020 });
for (const finish of [iron, pipeSteel, bronze, brass, collarActive, riserFinish]) {
  Object.assign(finish, brushedTexture, { bumpScale: 0.009 });
}
for (const finish of [machineEnamel, enamelBlue, machineryRed, fixedPipeFinish]) {
  Object.assign(finish, enamelTexture, { bumpScale: 0.012 });
}
const tileShape = new THREE.Shape().moveTo(-0.46, -0.46).lineTo(0.46, -0.46)
  .lineTo(0.46, 0.46).lineTo(-0.46, 0.46).closePath();
const tileGeometry = new THREE.ExtrudeGeometry(tileShape, {
  depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.024, bevelSegments: 2,
});
tileGeometry.rotateX(-Math.PI / 2);
const tilePositions = tileGeometry.attributes.position;
const tileUvs = tileGeometry.attributes.uv;
for (let i = 0; i < tilePositions.count; i++) {
  tileUvs.setXY(i, tilePositions.getX(i) + 0.5, tilePositions.getZ(i) + 0.5);
}
for (let z = 0; z < size; z++) {
  for (let x = 0; x < size; x++) {
    const tile = mesh(tileGeometry, tileFinishes[(x * 7 + z * 11 + x * z) % 4], tray, world(x), -0.101, world(z));
    tile.userData.position = [x, z];
    tiles.push(tile);
  }
}
function buildTerrain(group, terrain) {
  for (const [x, z, height, kind] of terrain) {
    const support = atTile(x, z, group, height);
    const wall = kind === 'wall';
    const width = wall ? 0.99 : 0.88;
    for (let step = 0; step < height; step++) {
      const y = -(step + 0.5) * heightStep;
      castBlock(support, wall ? wallFinish : platformFinish,
        width, heightStep, width, 0, y, 0, 0.028);
      castBlock(support, bronze, width + 0.006, 0.04, width + 0.006,
        0, y - heightStep * 0.29, 0, 0.011);
    }
    castBlock(support, deckFinish, 0.91, 0.074, 0.91, 0, -0.036, 0, 0.018);
    bolts(support, 0.37, 0.018);
    const panel = castBlock(support, wall ? enamelBlue : bronze, 0.27, 0.138, 0.033,
      0, -0.174, width / 2, 0.013);
    panel.castShadow = false;
    for (let i = 0; i < height; i++) {
      box(support, brass, 0.024, 0.066, 0.008, (i - (height - 1) / 2) * 0.051, -0.174, width / 2 + 0.019);
    }
  }
}

function buildLevel(definition) {
  const group = new THREE.Group();
  group.visible = false;
  tray.add(group);
  const terrain = definition.terrain ?? [];
  const heights = new Map(terrain.map(([x, z, height]) => [key(x, z), height]));
  buildTerrain(group, terrain);
  for (const [x, z] of definition.obstacles) {
    const block = atTile(x, z, group);
    castBlock(block, dark, 0.85, 0.10, 0.85, 0, 0.05, 0, 0.025);
    castBlock(block, castSteel, 0.77, 0.38, 0.77, 0, 0.25, 0, 0.043);
    castBlock(block, bronze, 0.805, 0.025, 0.805, 0, 0.361, 0, 0.009);
    castBlock(block, iron, 0.81, 0.075, 0.81, 0, 0.407, 0, 0.019);
    bolts(block, 0.294, 0.459);
  }

  const boiler = atTile(...definition.source, group, heights.get(key(...definition.source)) ?? 0);
  const makeBoiler = definition.boiler ?? buildBoiler;
  const { gaugeNeedle, vent, valve } = makeBoiler(boiler, definition.view[0]);
  vent.add(boiler.position);

  const receivers = definition.receivers ?? [{ position: definition.destination, build: definition.build }];
  return {
    ...definition, group, gaugeNeedle, vent, valve, pressure: 0, targetPressure: 0, pressureVelocity: 0,
    completionTime: 0, celebrated: false, rewardShown: false, solved: false, past: [], future: [],
    machines: new Map(receivers.map(({ position, port = 2, build }) => [
      key(...position), buildReceiver(group, position, port, build, heights.get(key(...position)) ?? 0),
    ])),
    heights,
    sourceKey: key(...definition.source),
    blocked: new Set(definition.obstacles.map(position => key(...position))),
    pipes: new Map(),
    fixtureBounds: group.children.flatMap(fixture => boxCorners(new THREE.Box3().setFromObject(fixture))),
  };
}

function buildBoilerBase(boiler) {
  castBlock(boiler, frame, 0.94, 0.10, 0.89, 0, 0.051, 0, 0.025);
  castBlock(boiler, bronze, 0.89, 0.033, 0.84, 0, 0.109, 0, 0.010);
  castBlock(boiler, machineEnamel, 0.845, 0.04, 0.79, 0, 0.131, 0, 0.010);
  bolts(boiler, 0.34, 0.145);

}

function buildBoilerOutlet(boiler) {
  cylinder(boiler, bronze, 0.132, 0.19, 0.39, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.157, 0.072, 0.452, pipeHeight, 0, 'x');
}

function buildBoilerVent(boiler, x, top, z, radius) {
  cylinder(boiler, bronze, radius * 0.81, 0.16, x, top - 0.10, z);
  cylinder(boiler, brass, radius, 0.037, x, top - 0.019, z);
  cylinder(boiler, gasket, radius * 0.61, 0.006, x, top + 0.001, z);
  // The outlet is expressed in the tray's coordinates, alongside pipe and receiver exhausts.
  return new THREE.Vector3(x, top + 0.035, z);
}

function buildBoiler(boiler, heading) {
  buildBoilerBase(boiler);
  const centerY = 0.43;
  cylinder(boiler, boilerCopper, 0.284, 0.61, -0.033, centerY, 0, 'x');
  for (const x of [-0.318, 0.252]) {
    for (const z of [-0.158, 0.158]) {
      castBlock(boiler, brass, 0.138, 0.19, 0.14, x + 0.036, 0.212, z, 0.028);
    }
    const dome = mesh(new THREE.SphereGeometry(0.279, 28, 16), boilerCopper, boiler, x, centerY, 0);
    dome.scale.x = 0.30;
    cylinder(boiler, bronze, 0.298, 0.072, x, centerY, 0, 'x');
    for (const offset of [-0.029, 0.029]) {
      mesh(new THREE.TorusGeometry(0.292, 0.012, 8, 32), brass, boiler, x + offset, centerY, 0)
        .rotation.y = Math.PI / 2;
    }
    for (let i = 0; i < 14; i++) {
      const angle = (i + 0.5) * Math.PI / 7;
      mesh(rivetGeometry, brass, boiler, x, centerY + 0.296 * Math.cos(angle), 0.296 * Math.sin(angle))
        .scale.setScalar(0.76);
    }
  }

  buildBoilerOutlet(boiler);
  const vent = buildBoilerVent(boiler, -0.22, 0.86, -0.126, 0.091);
  cylinder(boiler, brass, 0.044, 0.198, 0.18, 0.778, 0.012);
  cylinder(boiler, bronze, 0.079, 0.055, 0.18, 0.713, 0.012);
  const valve = new THREE.Group();
  valve.position.set(0.18, 0.89, 0.012);
  valve.rotation.x = -0.31;
  boiler.add(valve);
  mesh(new THREE.TorusGeometry(0.102, 0.014, 10, 28), brass, valve);
  for (let i = 0; i < 4; i++) {
    box(valve, bronze, 0.011, 0.181, 0.015, 0, 0, 0).rotation.z = i * Math.PI / 4;
  }
  cylinder(valve, brass, 0.032, 0.027, 0, 0, 0, 'z');

  const badge = new THREE.Group();
  badge.position.set(-0.024, 0.445, 0.283);
  boiler.add(badge);
  mesh(new THREE.CircleGeometry(0.119, 32), bronze, badge);
  mesh(new THREE.CircleGeometry(0.103, 32), enamelBlue, badge, 0, 0, 0.004);
  mesh(crestGeometry, brass, badge, 0, 0.005, 0.008).scale.setScalar(0.84);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const angle = -1.05 + i * 0.27;
      const leaf = mesh(rivetGeometry, brass, badge, side * Math.cos(angle) * 0.154, Math.sin(angle) * 0.134, -0.009);
      leaf.scale.set(0.43, 1.0, 0.48);
      leaf.rotation.z = side * (0.64 - i * 0.23);
    }
  }
  return { gaugeNeedle: mountBoilerGauge(boiler, heading), vent, valve };
}

function buildKettle(boiler, heading) {
  buildBoilerBase(boiler);
  // A broad blue kettle with a gilded crown is the counterpart to the horizontal copper boiler.
  const body = new THREE.LatheGeometry([
    [0, 0.18], [0.21, 0.18], [0.258, 0.25], [0.29, 0.34], [0.314, 0.46],
    [0.309, 0.60], [0.28, 0.69], [0.23, 0.73], [0, 0.73],
  ].map(([radius, height]) => new THREE.Vector2(radius, height)), 36);
  mesh(body, enamelBlue, boiler, -0.035, 0, 0);
  for (const [r, y] of [[0.247, 0.247], [0.302, 0.418], [0.304, 0.584], [0.258, 0.697]]) {
    mesh(new THREE.TorusGeometry(r, 0.014, 8, 36), brass, boiler, -0.035, y, 0).rotation.x = Math.PI / 2;
  }
  const crown = mesh(new THREE.SphereGeometry(0.245, 24, 12), brass, boiler, -0.035, 0.718, 0);
  crown.scale.y = 0.31;
  const vent = buildBoilerVent(boiler, -0.035, 0.89, -0.078, 0.069);
  mesh(crestGeometry, inlay, boiler, -0.025, 0.508, 0.309).scale.setScalar(0.80);
  for (const z of [-0.205, 0.205]) {
    castBlock(boiler, brass, 0.11, 0.15, 0.14, 0.05, 0.199, z, 0.025);
  }
  buildBoilerOutlet(boiler);
  return { gaugeNeedle: mountBoilerGauge(boiler, heading), vent };
}

function buildDuplexBoiler(boiler, heading) {
  buildBoilerBase(boiler);
  for (const z of [-0.188, 0.188]) {
    castBlock(boiler, bronze, 0.63, 0.15, 0.22, -0.034, 0.218, z, 0.03);
    cylinder(boiler, boilerCopper, 0.153, 0.67, -0.04, 0.382, z, 'x');
    for (const x of [-0.36, 0.274]) {
      const cap = mesh(new THREE.SphereGeometry(0.155, 22, 12), boilerCopper, boiler, x, 0.382, z);
      cap.scale.x = 0.27;
      cylinder(boiler, brass, 0.165, 0.057, x, 0.382, z, 'x');
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        mesh(rivetGeometry, bronze, boiler, x, 0.382 + Math.cos(angle) * 0.16, z + Math.sin(angle) * 0.16)
          .scale.setScalar(0.61);
      }
    }
    if (z > 0) {
      cylinder(boiler, bronze, 0.043, 0.12, 0.20, 0.565, z);
      cylinder(boiler, brass, 0.069, 0.036, 0.20, 0.634, z);
    }
  }
  cylinder(boiler, bronze, 0.066, 0.44, 0.292, 0.302, 0, 'z');
  cylinder(boiler, brass, 0.089, 0.115, 0.308, 0.285, 0, 'x');
  castBlock(boiler, enamelBlue, 0.245, 0.082, 0.158, -0.159, 0.565, 0.138, 0.024);
  mesh(crestGeometry, inlay, boiler, -0.10, 0.385, 0.343).scale.setScalar(0.77);
  buildBoilerOutlet(boiler);
  const instrument = new THREE.Group();
  instrument.position.y = -0.092;
  boiler.add(instrument);
  const vent = buildBoilerVent(boiler, 0.20, 0.66, -0.196, 0.069);
  return { gaugeNeedle: mountBoilerGauge(instrument, heading), vent };
}

function makeGaugeFace() {
  const dial = document.createElement('canvas');
  dial.width = dial.height = 256;
  const ctx = dial.getContext('2d');
  const paper = ctx.createRadialGradient(102, 90, 12, 128, 128, 128);
  paper.addColorStop(0, '#fff0cd');
  paper.addColorStop(1, '#c9a777');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 256, 256);
  const random = randomTextureSample();
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(86, 57, 33, ${random() * 0.14})`;
    ctx.fillRect(random() * 256, random() * 256, 1.4, 1.4);
  }
  ctx.strokeStyle = '#473021';
  for (let i = 0; i <= 20; i++) {
    const angle = THREE.MathUtils.degToRad(-210 + i * 12);
    const inner = i % 5 === 0 ? 88 : 99;
    ctx.lineWidth = i % 5 === 0 ? 3 : 1.6;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * inner, 128 + Math.sin(angle) * inner);
    ctx.lineTo(128 + Math.cos(angle) * 110, 128 + Math.sin(angle) * 110);
    ctx.stroke();
  }
  ctx.fillStyle = '#493524';
  ctx.textAlign = 'center';
  ctx.font = '600 20px Georgia';
  ctx.fillText('0', 62, 174);
  ctx.fillText('50', 128, 65);
  ctx.fillText('100', 194, 174);
  ctx.font = '600 16px Georgia';
  ctx.fillText('STEAM', 128, 190);
  const face = new THREE.CanvasTexture(dial);
  face.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: face, roughness: 0.78 });
}

const gaugeFace = makeGaugeFace();

function mountBoilerGauge(boiler, heading) {
  const gauge = new THREE.Group();
  gauge.position.set(-0.193, 0.984, 0.211);
  gauge.rotation.set(-0.57, THREE.MathUtils.degToRad(heading * 0.47), 0, 'YXZ');
  gauge.scale.setScalar(0.92);
  boiler.add(gauge);

  // The pressure tap starts inside the boiler and the union meets the back of the dial.
  cylinder(boiler, bronze, 0.061, 0.086, -0.193, 0.689, 0.145);
  const stem = cylinder(boiler, brass, 0.027, 0.265, -0.193, 0.813, 0.157);
  stem.rotation.x = 0.12;
  cylinder(boiler, brass, 0.042, 0.033, -0.193, 0.752, 0.149);
  cylinder(gauge, iron, 0.107, 0.098, 0, 0, -0.039, 'z');
  cylinder(gauge, bronze, 0.226, 0.074, 0, 0, 0, 'z');
  mesh(new THREE.CircleGeometry(0.205, 40), gaugeFace, gauge, 0, 0, 0.039);
  mesh(new THREE.TorusGeometry(0.213, 0.014, 8, 32), brass, gauge, 0, 0, 0.044);
  for (const x of [-0.172, 0.172]) {
    const screw = cylinder(gauge, bronze, 0.011, 0.006, x, -0.025, 0.043, 'z');
    screw.castShadow = false;
  }
  const needle = new THREE.Group();
  gauge.add(needle);
  const pointer = new THREE.Shape().moveTo(-0.018, -0.032)
    .lineTo(0.018, -0.032).lineTo(0.014, 0.127).lineTo(0, 0.176)
    .lineTo(-0.014, 0.127).closePath();
  const hand = mesh(new THREE.ShapeGeometry(pointer), gaugeRed, needle, 0, 0, 0.058);
  hand.castShadow = false;
  cylinder(gauge, brass, 0.018, 0.014, 0, 0, 0.061, 'z');
  return needle;
}

function buildReceiver(group, position, port, build, height) {
  const receiver = atTile(...position, group, height);
  receiver.rotation.y = -(port - 2) * Math.PI / 2;
  castBlock(receiver, dark, 0.97, 0.075, 0.98, 0, 0.0375, 0, 0.019);
  castBlock(receiver, bronze, 0.951, 0.035, 0.95, 0, 0.076, 0, 0.011);
  castBlock(receiver, machineEnamel, 0.91, 0.12, 0.91, 0, 0.124, 0, 0.027);
  bolts(receiver, 0.36, 0.19);
  for (const z of [-0.447, 0.447]) {
    castBlock(receiver, inlay, 0.723, 0.030, 0.022, 0, 0.122, z, 0.006);
  }
  const insignia = mesh(crestGeometry, brass, receiver, 0, 0.153, 0.466);
  insignia.scale.setScalar(0.63);
  const plate = castBlock(receiver, enamelBlue, 0.22, 0.093, 0.029, 0, 0.132, 0.446, 0.010);
  plate.castShadow = false;
  cylinder(receiver, iron, 0.11, 0.36, -0.32, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.146, 0.085, -0.44, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.05, 0.38, -0.29, 0.39, -0.32);
  cylinder(receiver, iron, 0.065, 0.045, -0.29, 0.58, -0.32);
  cylinder(receiver, bronze, 0.080, 0.056, -0.29, 0.282, 0.32);
  mesh(new THREE.TorusGeometry(0.061, 0.009, 7, 18), brass, receiver, -0.29, 0.332, 0.32)
    .rotation.x = Math.PI / 2;
  const lampMaterial = material(0x5c351c, 0.1);
  const lamp = mesh(new THREE.SphereGeometry(0.056, 16, 10), lampMaterial, receiver, -0.29, 0.36, 0.32);
  const lampLight = new THREE.PointLight(0xffa33e, 0, 1.35);
  lampLight.position.copy(lamp.position);
  receiver.add(lampLight);

  const ventPosition = new THREE.Vector3(-0.29, 0.61, -0.32)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), receiver.rotation.y)
    .add(receiver.position);
  const mechanism = new THREE.Group();
  receiver.add(mechanism);
  // Leave the inlet and mounting plate at their exact tile height.
  if ([buildFlywheel, buildFan, buildPress].includes(build)) {
    mechanism.scale.y = 1.23;
    mechanism.position.y = -0.037;
  }
  return {
    port, lampMaterial, lampLight,
    vent: { ...ventPosition, dx: 0, dz: 0 },
    animate: build(mechanism), powered: false, speed: 0, phase: 0, startup: 0,
  };
}

function buildFlywheel(receiver) {
  cylinder(receiver, pipeSteel, 0.142, 0.33, -0.18, 0.39, 0.08, 'x');
  for (const x of [-0.34, -0.018]) {
    cylinder(receiver, brass, 0.157, 0.049, x, 0.39, 0.08, 'x');
    mesh(new THREE.TorusGeometry(0.101, 0.01, 8, 24), bronze, receiver, x - 0.024, 0.39, 0.08)
      .rotation.y = Math.PI / 2;
  }
  castBlock(receiver, bronze, 0.29, 0.32, 0.28, 0.213, 0.30, -0.048, 0.045);
  const stand = new THREE.Group();
  stand.position.set(0.213, 0.30, -0.042);
  receiver.add(stand);
  for (const x of [-0.083, 0.083]) {
    const leg = castBlock(stand, brass, 0.086, 0.427, 0.099, x, 0.085, 0.027, 0.019);
    leg.rotation.z = x < 0 ? -0.32 : 0.32;
  }
  cylinder(receiver, iron, 0.072, 0.31, 0.213, 0.556, 0.06, 'z');

  const wheel = new THREE.Group();
  wheel.position.set(0.213, 0.556, 0.188);
  receiver.add(wheel);
  mesh(new THREE.TorusGeometry(0.323, 0.047, 12, 44), bronze, wheel);
  mesh(new THREE.TorusGeometry(0.333, 0.019, 8, 44), brass, wheel, 0, 0, 0.043);
  mesh(new THREE.TorusGeometry(0.333, 0.019, 8, 44), brass, wheel, 0, 0, -0.043);
  cylinder(wheel, brass, 0.08, 0.105, 0, 0, 0, 'z');
  for (let spoke = 0; spoke < 6; spoke++) {
    const angle = spoke * Math.PI / 3;
    const bar = castBlock(wheel, brass, 0.043, 0.28, 0.050, -Math.sin(angle) * 0.169, Math.cos(angle) * 0.169, 0, 0.012);
    bar.rotation.z = angle;
  }
  cylinder(wheel, bronze, 0.064, 0.043, 0, 0, 0.054, 'z');
  cylinder(wheel, brass, 0.042, 0.022, 0, 0, 0.086, 'z');
  cylinder(wheel, brass, 0.035, 0.067, 0.147, 0, 0.042, 'z');
  const crank = castBlock(receiver, brass, 1, 0.045, 0.037, 0, 0, 0, 0.012);
  const piston = cylinder(receiver, iron, 0.041, 0.23, -0.19, 0.38, 0.2, 'x');
  return phase => {
    wheel.rotation.z = -phase;
    const pinX = wheel.position.x + Math.cos(wheel.rotation.z) * 0.147;
    const pinY = wheel.position.y + Math.sin(wheel.rotation.z) * 0.147;
    piston.position.x = -0.15 + Math.cos(wheel.rotation.z) * 0.065;
    const pistonX = piston.position.x + 0.09;
    const pistonY = piston.position.y;
    crank.position.set((pinX + pistonX) / 2, (pinY + pistonY) / 2, 0.256);
    crank.scale.x = Math.hypot(pinX - pistonX, pinY - pistonY);
    crank.rotation.z = Math.atan2(pinY - pistonY, pinX - pistonX);
  };
}

function buildFan(receiver) {
  box(receiver, machineEnamel, 0.48, 0.42, 0.40, 0.08, 0.31, -0.04);
  cylinder(receiver, iron, 0.34, 0.12, 0.08, 0.64, 0.02, 'z');
  cylinder(receiver, dark, 0.29, 0.024, 0.08, 0.64, 0.085, 'z');
  mesh(new THREE.TorusGeometry(0.323, 0.022, 8, 40), bronze, receiver, 0.08, 0.64, -0.053);
  const rotor = new THREE.Group();
  rotor.position.set(0.08, 0.64, 0.15);
  receiver.add(rotor);
  cylinder(rotor, brass, 0.084, 0.09, 0, 0, 0, 'z');
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Group();
    blade.rotation.z = i * Math.PI * 2 / 5;
    rotor.add(blade);
    box(blade, machineEnamel, 0.115, 0.23, 0.035, 0.027, 0.16, 0).rotation.z = -0.26;
  }
  mesh(new THREE.TorusGeometry(0.32, 0.031, 10, 40), brass, receiver, 0.08, 0.64, 0.18);
  return phase => { rotor.rotation.z = phase * 1.5; };
}

function buildPress(receiver) {
  const enamel = Object.assign(material(0x692b3c, 0.40), enamelTexture, { bumpScale: 0.012 });
  box(receiver, iron, 0.55, 0.12, 0.46, 0.08, 0.20, 0.07);
  for (const x of [-0.19, 0.35]) {
    box(receiver, enamel, 0.09, 0.69, 0.20, x, 0.49, 0.03);
    cylinder(receiver, brass, 0.036, 0.48, x, 0.47, 0.20);
  }
  castBlock(receiver, enamel, 0.68, 0.16, 0.42, 0.08, 0.85, 0.05, 0.028);
  castBlock(receiver, bronze, 0.61, 0.030, 0.385, 0.08, 0.789, 0.05, 0.010);
  cylinder(receiver, iron, 0.15, 0.23, 0.08, 0.87, 0.07);
  cylinder(receiver, brass, 0.17, 0.045, 0.08, 0.99, 0.07);
  const ram = new THREE.Group();
  receiver.add(ram);
  cylinder(ram, brass, 0.06, 0.38, 0.08, 0.71, 0.07);
  box(ram, iron, 0.31, 0.11, 0.29, 0.08, 0.52, 0.07);
  box(receiver, brass, 0.24, 0.038, 0.23, 0.08, 0.28, 0.07);
  return phase => {
    ram.position.y = -0.156 * Math.pow((1 - Math.cos(phase * 0.52)) * 0.5, 2);
  };
}

function positionRod(rod, a, b) {
  const axis = new THREE.Vector3().subVectors(b, a);
  rod.position.copy(a).addScaledVector(axis, 0.5);
  rod.scale.y = axis.length();
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
}

function buildCompressor(machine) {
  castBlock(machine, machineEnamel, 0.78, 0.19, 0.56, 0, 0.26, 0, 0.04);
  box(machine, castSteel, 0.75, 0.44, 0.14, 0, 1.01, -0.20);
  const crankshaft = cylinder(machine, iron, 0.072, 0.77, 0, 0.50, 0.16, 'x');
  const eccentrics = [-0.22, 0.22].map((x, index) => {
    cylinder(machine, machineryRed, 0.158, 0.34, x, 1.08, 0.12);
    for (let fin = 0; fin < 5; fin++) {
      cylinder(machine, castSteel, 0.182, 0.024, x, 0.96 + fin * 0.059, 0.12);
    }
    cylinder(machine, brass, 0.108, 0.07, x, 1.27, 0.12);
    const cam = new THREE.Group();
    cam.position.set(x, 0.50, 0.16);
    machine.add(cam);
    cylinder(cam, bronze, 0.15, 0.061, 0, 0, 0, 'x');
    cylinder(cam, brass, 0.043, 0.13, 0.015, 0.10, 0, 'x');
    const piston = cylinder(machine, iron, 0.052, 0.24, x, 0.87, 0.12);
    const rod = cylinder(machine, brass, 0.023, 1, x, 0.7, 0.12);
    const a = new THREE.Vector3(x, 0, 0);
    const b = new THREE.Vector3(x, 0, 0.12);
    return phase => {
      const angle = phase + index * Math.PI;
      const lift = Math.cos(angle) * 0.088;
      cam.rotation.x = angle;
      a.set(x, 0.50 + Math.cos(angle) * 0.10, 0.16 + Math.sin(angle) * 0.10);
      piston.position.y = 0.88 + lift;
      b.y = piston.position.y - 0.11;
      positionRod(rod, a, b);
    };
  });
  cylinder(machine, bronze, 0.049, 0.49, 0, 1.34, 0.12, 'x');
  return phase => {
    crankshaft.rotation.set(phase, 0, Math.PI / 2);
    for (const move of eccentrics) move(phase);
  };
}

function buildBeamPump(machine) {
  castBlock(machine, machineEnamel, 0.78, 0.14, 0.62, 0, 0.23, 0, 0.03);
  castBlock(machine, castSteel, 0.23, 0.99, 0.31, 0, 0.77, -0.16, 0.037);
  const beam = new THREE.Group();
  beam.position.set(0, 1.28, 0.07);
  machine.add(beam);
  castBlock(beam, machineryRed, 0.92, 0.14, 0.17, 0, 0, 0, 0.028);
  cylinder(beam, brass, 0.085, 0.20, 0, 0, 0, 'z');
  const pumps = [-0.33, 0.33].map(x => {
    cylinder(machine, bronze, 0.118, 0.40, x, 0.49, 0.09);
    cylinder(machine, brass, 0.14, 0.055, x, 0.69, 0.09);
    const plunger = cylinder(machine, iron, 0.051, 0.33, x, 0.79, 0.09);
    const rod = cylinder(machine, brass, 0.029, 1, x, 1, 0.09);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3(x, 0, 0.09);
    return angle => {
      a.set(x * Math.cos(angle), 1.28 + x * Math.sin(angle), 0.09);
      plunger.position.y = 0.80 + x * Math.sin(angle);
      b.y = plunger.position.y + 0.15;
      positionRod(rod, a, b);
    };
  });
  const wheel = new THREE.Group();
  wheel.position.set(0, 0.56, 0.26);
  machine.add(wheel);
  mesh(new THREE.TorusGeometry(0.225, 0.032, 8, 28), brass, wheel);
  for (let i = 0; i < 3; i++) {
    box(wheel, castSteel, 0.024, 0.42, 0.035, 0, 0, 0).rotation.z = i * Math.PI / 3;
  }
  return phase => {
    const angle = Math.sin(phase * 0.67) * 0.28;
    beam.rotation.z = angle;
    wheel.rotation.z = -phase * 0.67;
    for (const move of pumps) move(angle);
  };
}

function buildBell(machine) {
  castBlock(machine, frame, 0.76, 0.11, 0.66, 0, 0.23, 0, 0.035);
  for (const x of [-0.28, 0.28]) {
    castBlock(machine, enamelBlue, 0.11, 0.88, 0.14, x, 0.69, 0, 0.027);
    cylinder(machine, bronze, 0.073, 0.105, x, 1.03, 0, 'x');
    mesh(rivetGeometry, brass, machine, x, 1.11, 0).scale.setScalar(1.25);
  }
  const yoke = new THREE.Group();
  yoke.position.y = 1.03;
  machine.add(yoke);
  cylinder(yoke, bronze, 0.035, 0.56, 0, 0, 0, 'x');
  const shell = new THREE.LatheGeometry([
    [0.056, 0], [0.12, -0.07], [0.151, -0.17], [0.165, -0.26], [0.211, -0.34], [0.209, -0.38],
    [0.184, -0.38], [0.151, -0.26], [0.132, -0.16], [0.094, -0.08], [0.034, -0.018],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 40);
  mesh(shell, brass, yoke);
  mesh(new THREE.TorusGeometry(0.204, 0.014, 8, 32), bronze, yoke, 0, -0.365, 0).rotation.x = Math.PI / 2;
  const clapper = new THREE.Group();
  yoke.add(clapper);
  cylinder(clapper, castSteel, 0.018, 0.32, 0, -0.22, 0);
  mesh(new THREE.SphereGeometry(0.047, 16, 10), bronze, clapper, 0, -0.387, 0);
  return (phase, speed) => {
    const travel = Math.min(1, speed / 8);
    yoke.rotation.x = Math.sin(phase * 0.85) * 0.53 * travel;
    clapper.rotation.x = Math.sin(phase * 0.85 - 0.9) * 0.30 * travel;
  };
}

function buildFountain(machine) {
  cylinder(machine, enamelBlue, 0.311, 0.13, 0, 0.245, 0);
  cylinder(machine, bronze, 0.235, 0.18, 0, 0.35, 0);
  const basin = new THREE.LatheGeometry([
    [0.09, 0], [0.145, 0.04], [0.265, 0.092], [0.319, 0.166],
    [0.295, 0.18], [0.241, 0.118], [0.10, 0.081],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 44);
  mesh(basin, brass, machine, 0, 0.415, 0);
  cylinder(machine, enamelBlue, 0.235, 0.018, 0, 0.527, 0);
  const crown = new THREE.Group();
  machine.add(crown);
  cylinder(crown, bronze, 0.058, 0.322, 0, 0.685, 0);
  mesh(new THREE.SphereGeometry(0.072, 20, 12), brass, crown, 0, 0.886, 0);
  for (let i = 0; i < 3; i++) {
    const spout = new THREE.Group();
    spout.rotation.y = i * Math.PI * 2 / 3;
    crown.add(spout);
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.025, 0.75, 0), new THREE.Vector3(0.14, 0.90, 0),
      new THREE.Vector3(0.20, 0.87, 0), new THREE.Vector3(0.23, 0.74, -0.035),
    );
    mesh(new THREE.TubeGeometry(curve, 18, 0.026, 10), brass, spout);
    cylinder(spout, bronze, 0.038, 0.030, 0.23, 0.735, -0.035);
  }
  return phase => { crown.rotation.y = phase * 0.69; };
}

function buildShutters(machine) {
  castBlock(machine, enamelBlue, 0.72, 0.13, 0.63, 0, 0.235, 0, 0.032);
  for (const x of [-0.292, 0.292]) {
    castBlock(machine, frame, 0.105, 0.85, 0.17, x, 0.704, 0, 0.018);
    castBlock(machine, brass, 0.08, 0.10, 0.19, x, 0.375, 0, 0.013);
  }
  castBlock(machine, frame, 0.70, 0.12, 0.212, 0, 1.128, 0, 0.024);
  const blades = [];
  for (let i = 0; i < 4; i++) {
    const y = 0.466 + i * 0.174;
    const blade = new THREE.Group();
    blade.position.y = y;
    machine.add(blade);
    castBlock(blade, machineEnamel, 0.47, 0.147, 0.069, 0, 0, 0, 0.009);
    box(blade, inlay, 0.44, 0.012, 0.01, 0, -0.054, 0.036);
    cylinder(blade, brass, 0.027, 0.59, 0, 0, 0, 'x');
    blades.push(blade);
  }
  return (phase, speed) => {
    const travel = Math.min(1, speed / 8);
    for (const [i, blade] of blades.entries()) {
      blade.rotation.x = (0.64 + 0.48 * Math.sin(phase * 0.84 - i * 0.39)) * travel;
    }
  };
}

function buildCarillon(machine) {
  castBlock(machine, frame, 0.79, 0.11, 0.69, 0, 0.23, 0, 0.035);
  for (const x of [-0.282, 0.282]) {
    castBlock(machine, machineryRed, 0.11, 0.52, 0.49, x, 0.50, 0, 0.028);
    cylinder(machine, brass, 0.081, 0.055, x * 1.13, 0.58, 0, 'x');
  }
  const drum = new THREE.Group();
  drum.position.y = 0.58;
  machine.add(drum);
  cylinder(drum, bronze, 0.171, 0.49, 0, 0, 0, 'x');
  for (const x of [-0.239, 0.239]) cylinder(drum, brass, 0.182, 0.030, x, 0, 0, 'x');
  const followers = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.083;
    for (let j = 0; j < 3; j++) {
      const angle = i * 0.81 + j * (Math.PI * 2 / 3);
      mesh(rivetGeometry, brass, drum, x, Math.cos(angle) * 0.181, Math.sin(angle) * 0.181);
    }
    const finger = new THREE.Group();
    finger.position.set(x, 0.789, -0.21);
    machine.add(finger);
    box(finger, i % 2 ? brass : castSteel, 0.041, 0.034, 0.24, 0, 0, 0.102);
    followers.push(finger);
  }
  castBlock(machine, bronze, 0.55, 0.065, 0.10, 0, 0.795, -0.238, 0.013);
  return (phase, speed) => {
    drum.rotation.x = phase * 0.57;
    for (const [i, finger] of followers.entries()) {
      finger.rotation.x = -Math.pow(Math.max(0, Math.cos(phase * 1.71 + i * 2.43)), 7)
        * 0.36 * Math.min(1, speed / 6);
    }
  };
}

function buildGovernor(machine) {
  castBlock(machine, machineryRed, 0.74, 0.24, 0.63, 0, 0.29, 0, 0.044);
  // Support the rotating shaft from below, clear of the flyweights' entire sweep.
  const bearing = cylinder(machine, castSteel, 0.107, 0.225, 0, 0.565, 0);
  cylinder(machine, brass, 0.119, 0.046, 0, 0.665, 0);
  mesh(new THREE.TorusGeometry(0.085, 0.009, 8, 24), bronze, bearing, 0, 0.072, 0)
    .rotation.x = Math.PI / 2;

  const spindle = new THREE.Group();
  spindle.position.y = 1.27;
  machine.add(spindle);
  cylinder(spindle, bronze, 0.041, 0.67, 0, -0.31, 0);
  castBlock(spindle, bronze, 0.226, 0.078, 0.095, 0, 0, 0, 0.022);
  cylinder(spindle, brass, 0.073, 0.050, 0, 0.053, 0);
  const sleeve = cylinder(spindle, brass, 0.089, 0.128, 0, -0.36, 0);
  const arms = [-1, 1].map(sign => {
    const pivot = sign * 0.078;
    const arm = new THREE.Group();
    arm.position.x = pivot;
    spindle.add(arm);
    cylinder(spindle, brass, 0.026, 0.112, pivot, 0, 0, 'z');
    cylinder(arm, brass, 0.024, 0.40, 0, -0.18, 0);
    mesh(new THREE.SphereGeometry(0.094, 20, 12), bronze, arm, 0, -0.39, 0);
    const link = cylinder(spindle, castSteel, 0.017, 1, 0, -0.35, 0);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    return spread => {
      arm.rotation.z = sign * spread;
      a.set(pivot + sign * Math.sin(spread) * 0.29, -Math.cos(spread) * 0.29, 0);
      b.set(sign * 0.081, sleeve.position.y, 0);
      positionRod(link, a, b);
    };
  });
  const pulley = cylinder(machine, bronze, 0.25, 0.08, 0, 0.44, 0);
  for (let i = 0; i < 4; i++) {
    mesh(boltGeometry, brass, pulley, Math.cos(i * Math.PI / 2) * 0.18, 0.051, Math.sin(i * Math.PI / 2) * 0.18);
  }
  return (phase, speed) => {
    const spread = 0.53 + 0.45 * Math.min(1, speed / 10) + Math.sin(phase) * 0.02;
    spindle.rotation.y = phase * 1.12;
    pulley.rotation.y = phase * 1.12;
    sleeve.position.y = -0.41 + Math.sin(spread) * 0.18;
    for (const move of arms) move(spread);
  };
}

function makeGear(parent, radius, teeth, finish, x, y, z) {
  const gear = new THREE.Group();
  gear.position.set(x, y, z);
  parent.add(gear);
  const rim = new THREE.Shape();
  for (let tooth = 0; tooth < teeth; tooth++) {
    for (const [phase, height] of [[0, -0.006], [0.19, 0.018], [0.64, 0.018], [0.82, -0.006]]) {
      const angle = (tooth + phase) * Math.PI * 2 / teeth;
      const px = Math.cos(angle) * (radius + height);
      const py = Math.sin(angle) * (radius + height);
      if (tooth === 0 && phase === 0) rim.moveTo(px, py);
      else rim.lineTo(px, py);
    }
  }
  rim.closePath();
  for (let i = 0; i < 5; i++) {
    const cutout = new THREE.Path();
    const angle = i * Math.PI * 2 / 5;
    cutout.absarc(Math.cos(angle) * radius * 0.62, Math.sin(angle) * radius * 0.62,
      radius * 0.19, 0, Math.PI * 2, true);
    rim.holes.push(cutout);
  }
  mesh(new THREE.ExtrudeGeometry(rim, { depth: 0.04, bevelEnabled: false, curveSegments: 6 }), finish, gear, 0, 0, -0.020);
  cylinder(gear, bronze, radius * 0.22, 0.095, 0, 0, 0, 'z');
  cylinder(gear, brass, radius * 0.137, 0.03, 0, 0, 0.061, 'z');
  return gear;
}

function buildClockwork(machine) {
  castBlock(machine, frame, 0.83, 0.115, 0.69, 0, 0.21, 0, 0.036);
  castBlock(machine, enamelBlue, 0.78, 0.98, 0.135, 0, 0.736, -0.169, 0.046);
  for (const x of [-0.314, 0.314]) {
    cylinder(machine, brass, 0.038, 0.92, x, 0.673, -0.084);
    mesh(rivetGeometry, brass, machine, x, 1.144, -0.084).scale.setScalar(1.7);
  }
  const large = makeGear(machine, 0.225, 24, brass, -0.15, 0.84, -0.035);
  const small = makeGear(machine, 0.15, 16, bronze, 0.218, 0.753, -0.035);
  const pendulum = new THREE.Group();
  pendulum.position.set(-0.021, 0.777, 0.179);
  machine.add(pendulum);
  box(pendulum, brass, 0.029, 0.409, 0.022, 0, -0.18, 0);
  cylinder(pendulum, bronze, 0.105, 0.047, 0, -0.398, 0, 'z');
  cylinder(pendulum, brass, 0.069, 0.015, 0, -0.40, 0.027, 'z');
  return phase => {
    large.rotation.z = phase * 0.39;
    small.rotation.z = Math.PI / 16 - phase * 0.585;
    pendulum.rotation.z = Math.sin(phase * 0.84) * 0.34;
  };
}

function buildHoist(machine) {
  castBlock(machine, machineEnamel, 0.85, 0.115, 0.72, 0, 0.218, 0.013, 0.036);
  for (const x of [-0.317, 0.317]) {
    castBlock(machine, bronze, 0.115, 1.06, 0.169, x, 0.754, -0.121, 0.027);
    castBlock(machine, brass, 0.172, 0.10, 0.235, x, 1.287, -0.121, 0.025);
  }
  castBlock(machine, machineryRed, 0.79, 0.155, 0.27, 0, 1.359, -0.085, 0.041);
  const drum = new THREE.Group();
  drum.position.set(0, 1.12, 0.046);
  machine.add(drum);
  cylinder(drum, bronze, 0.103, 0.517, 0, 0, 0, 'x');
  for (let i = -4; i <= 4; i++) {
    mesh(new THREE.TorusGeometry(0.106, 0.008, 7, 22), dark, drum, i * 0.037, 0, 0).rotation.y = Math.PI / 2;
  }
  const cap = makeGear(drum, 0.16, 16, brass, 0.255, 0, 0);
  cap.rotation.y = Math.PI / 2;
  const load = new THREE.Group();
  machine.add(load);
  castBlock(load, frame, 0.21, 0.171, 0.22, 0, 0, 0, 0.028);
  box(load, brass, 0.19, 0.027, 0.203, 0, 0.067, 0);
  mesh(new THREE.TorusGeometry(0.050, 0.012, 7, 16), brass, load, 0, 0.123, 0);
  const cable = cylinder(machine, dark, 0.011, 1, 0, 0.83, 0.138);
  const cableTop = new THREE.Vector3(0, 1.12, 0.146);
  const cableBottom = new THREE.Vector3(0, 0.5, 0.146);
  return phase => {
    const lift = Math.sin(phase * 0.58);
    drum.rotation.x = -lift * 2.55;
    load.position.set(0, 0.599 + lift * 0.251, 0.146);
    cableBottom.y = load.position.y + 0.15;
    positionRod(cable, cableTop, cableBottom);
  };
}

function buildTurbine(machine) {
  castBlock(machine, enamelBlue, 0.82, 0.16, 0.63, 0, 0.238, 0.018, 0.042);
  for (const x of [-0.18, 0.18]) {
    castBlock(machine, bronze, 0.17, 0.392, 0.302, x, 0.411, -0.057, 0.043);
  }
  const shroud = new THREE.Group();
  shroud.position.set(0, 0.766, 0.065);
  machine.add(shroud);
  cylinder(shroud, machineryRed, 0.348, 0.27, 0, 0, -0.085, 'z');
  cylinder(shroud, dark, 0.308, 0.022, 0, 0, 0.062, 'z');
  mesh(new THREE.TorusGeometry(0.322, 0.027, 9, 40), brass, shroud, 0, 0, 0.106);
  mesh(new THREE.TorusGeometry(0.332, 0.013, 8, 38), bronze, shroud, 0, 0, -0.164);
  const rotor = new THREE.Group();
  rotor.position.z = 0.097;
  shroud.add(rotor);
  for (let i = 0; i < 9; i++) {
    const spoke = new THREE.Group();
    spoke.rotation.z = i * Math.PI * 2 / 9;
    rotor.add(spoke);
    const blade = castBlock(spoke, i % 2 ? bronze : brass, 0.091, 0.195, 0.044, 0.023, 0.178, 0, 0.013);
    blade.rotation.set(0, 0.32, -0.34);
  }
  cylinder(rotor, brass, 0.101, 0.082, 0, 0, 0.016, 'z');
  cylinder(rotor, bronze, 0.056, 0.038, 0, 0, 0.071, 'z');
  const regulator = makeGear(machine, 0.114, 12, brass, 0.254, 0.367, 0.244);
  const top = cylinder(machine, bronze, 0.054, 0.165, 0.192, 1.092, -0.031);
  mesh(new THREE.TorusGeometry(0.073, 0.010, 7, 20), brass, machine, 0.192, 1.185, -0.031).rotation.x = Math.PI / 2;
  top.castShadow = false;
  return phase => {
    rotor.rotation.z = -phase * 1.25;
    regulator.rotation.z = phase * 0.57;
  };
}

function pipeGeometry(type) {
  const radius = 0.126;
  const start = new THREE.Vector3(0.5, 0, 0);
  const path = type === 'straight'
    ? new THREE.LineCurve3(start, new THREE.Vector3(-0.5, 0, 0))
    : new THREE.CubicBezierCurve3(start, new THREE.Vector3(0.224, 0, 0), new THREE.Vector3(0, 0, 0.224), new THREE.Vector3(0, 0, 0.5));
  return new THREE.TubeGeometry(path, type === 'elbow' ? 24 : 1, radius, 24, false);
}

function riserGeometry(type) {
  const [low, high] = pipePorts[type].map(port => {
    const [x, z] = directions[port];
    return new THREE.Vector3(x * 0.5, 0, z * 0.5);
  });
  const lowTurn = low.clone().multiplyScalar(0.30);
  const highTurn = high.clone().multiplyScalar(0.30);
  high.y = highTurn.y = heightStep;
  return new THREE.TubeGeometry(new THREE.CubicBezierCurve3(low, lowTurn, highTurn, high), 28, 0.126, 24, false);
}

const bodies = {
  straight: pipeGeometry('straight'), elbow: pipeGeometry('elbow'),
  riser: riserGeometry('riser'), 'riser-elbow': riserGeometry('riser-elbow'),
};
const junctionHub = new THREE.SphereGeometry(0.155, 20, 12);
const junctionArm = new THREE.TubeGeometry(
  new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0.5, 0, 0)), 1, 0.126, 24, false,
);
const collarGeometry = new THREE.LatheGeometry([
  [0.094, -0.043], [0.138, -0.043], [0.156, -0.034],
  [0.156, -0.022], [0.146, -0.018], [0.146, 0.018],
  [0.156, 0.022], [0.156, 0.034], [0.138, 0.043], [0.094, 0.043], [0.094, -0.043],
].map(([radius, height]) => new THREE.Vector2(radius, height)), 32);
const gasketGeometry = new THREE.CylinderGeometry(0.144, 0.144, 0.017, 28, 1, true);
const boards = [];
let tool = 'straight';
let previewRotation = 0;
let touchPreview = null;
let powered = false;
let outlets = [];
let warmJoints = [];

function heightAt(index) {
  return level.heights.get(index) ?? 0;
}

function addPipe(x, z, type, rotation, fixed = false) {
  const group = atTile(x, z, level.group, heightAt(key(x, z)));
  group.position.y += pipeHeight;
  const body = fixed ? fixedPipeFinish : riseByPort[type] ? riserFinish : pipeSteel;
  const collars = buildPipeModel(group, type, { body, collar: brass, rivet: bronze }, fixed);
  group.rotation.y = -rotation * Math.PI / 2;
  level.pipes.set(key(x, z), { type, rotation, fixed, group, collars });
}

function buildPipeModel(group, type, finish, fixed = false) {
  const elevations = riseByPort[type];
  const body = finish.body;
  if (bodies[type]) {
    mesh(bodies[type], body, group);
  } else {
    mesh(junctionHub, body, group);
    for (const port of pipePorts[type]) {
      mesh(junctionArm, body, group).rotation.y = -port * Math.PI / 2;
    }
  }
  if (fixed) {
    const bracket = castBlock(group, bronze, 0.35, 0.065, 0.35, 0, -0.223, 0, 0.012);
    bolts(bracket, 0.132, 0.035);
  }
  return pipePorts[type].map((port, i) => {
    const [dx, dz] = directions[port];
    const flange = new THREE.Group();
    flange.position.set(dx * 0.451, (elevations?.[i] ?? 0) * heightStep, dz * 0.451);
    if (dx) flange.rotation.z = Math.PI / 2;
    else flange.rotation.x = Math.PI / 2;
    group.add(flange);
    const collar = mesh(collarGeometry, finish.collar, flange);
    mesh(gasketGeometry, finish.gasket ?? gasket, flange, 0, -0.041, 0);
    for (let i = 0; i < 4; i++) {
      const angle = (i + 0.5) * Math.PI / 2;
      mesh(rivetGeometry, finish.rivet, flange, Math.cos(angle) * 0.128, 0.025, Math.sin(angle) * 0.128);
    }
    return collar;
  });
}

function portsAt(index) {
  const height = heightAt(index);
  if (index === level.sourceKey) return [{ direction: 0, height }];
  const machine = level.machines.get(index);
  if (machine) return [{ direction: machine.port, height }];
  const pipe = level.pipes.get(index);
  return pipe ? piecePorts(pipe.type, pipe.rotation, height) : [];
}

function piecePorts(type, rotation, height) {
  return pipePorts[type].map((port, i) => ({
    direction: (port + rotation) % 4,
    height: height + (riseByPort[type]?.[i] ?? 0),
    raised: Boolean(riseByPort[type]?.[i]),
  }));
}

function matchingPort(x, z, direction, height) {
  return inside(x, z) && portsAt(key(x, z)).some(port =>
    port.direction === (direction + 2) % 4 && port.height === height);
}

function updateFlow(celebrate = true) {
  const depth = new Map([[level.sourceKey, 0]]);
  const queue = [level.sourceKey];
  const leaks = [];
  const joints = [];
  for (const index of queue) {
    if (level.machines.has(index)) continue;
    const x = index % size;
    const z = Math.floor(index / size);
    for (const { direction, height } of portsAt(index)) {
      const [dx, dz] = directions[direction];
      const next = key(x + dx, z + dz);
      const matched = matchingPort(x + dx, z + dz, direction, height);
      if (!matched) {
        leaks.push({
          x: world(x) + 0.49 * dx, y: pipeHeight + height * heightStep,
          z: world(z) + 0.49 * dz, dx, dz,
        });
      } else if (!depth.has(next)) {
        depth.set(next, depth.get(index) + 1);
        queue.push(next);
        if (level.pipes.has(index) && level.pipes.has(next)) {
          joints.push({
            x: world(x) + 0.49 * dx, y: pipeHeight + height * heightStep + 0.13,
            z: world(z) + 0.49 * dz, dx: dz * 0.20, dz: -dx * 0.20,
          });
        }
      }
    }
  }
  const leakCount = leaks.length;
  let supplied = 0;
  const exhausts = [];
  for (const [index, machine] of level.machines) {
    const wasPowered = machine.powered;
    machine.powered = depth.has(index);
    if (machine.powered && !wasPowered) {
      machine.startup = 0;
      playSound('hiss');
    }
    if (machine.powered) {
      supplied++;
      exhausts.push(machine.vent);
    }
    machine.lampMaterial.emissive.setHex(machine.powered ? 0xff9b28 : 0x000000);
    if (!machine.powered) machine.lampLight.intensity = 0;
  }
  const wasComplete = powered;
  powered = supplied === level.machines.size && leakCount === 0;
  if (!powered) {
    level.completionTime = 0;
    if (wasComplete) stopCelebration();
  } else if (!wasComplete) {
    for (const { sprite } of particles) sprite.visible = false;
    if (celebrate && !level.celebrated) startCelebration(depth);
  }
  const supply = supplied / level.machines.size;
  level.targetPressure = Math.round((35 + 65 * supply) / (1 + 0.85 * leakCount));
  pressureMeter.setAttribute('aria-valuenow', String(level.targetPressure));
  pressureReadout.textContent = `${level.targetPressure}%`;
  // Working exhausts are atmospheric only. A sealed board visibly settles.
  outlets = powered ? [] : [...leaks, ...exhausts];
  warmJoints = powered ? [] : joints;
  for (const [index, pipe] of level.pipes) {
    for (const collar of pipe.collars) collar.material = depth.has(index) ? collarActive : brass;
  }
  giftCase.classList.toggle('powered', powered);
  const leakStatus = leakCount === 0 ? 'No leaks' : leakCount === 1 ? '1 leak' : `${leakCount} leaks`;
  const tally = `${supplied}/${level.machines.size} powered · ${leakStatus}`;
  const message = powered ? `Board complete · ${tally}` : tally;
  if (status.textContent !== message) status.textContent = message;
  if (powered) level.solved = true;
  recordProgress();
}

function removePipe(index) {
  const pipe = level.pipes.get(index);
  if (pipe) pipe.group.removeFromParent();
  level.pipes.delete(index);
}

function pieceState(pipe) {
  return pipe ? { type: pipe.type, rotation: pipe.rotation } : null;
}

function applyPipeState(index, state) {
  const pipe = level.pipes.get(index);
  if (pipe && state && pipe.type === state.type) {
    pipe.rotation = state.rotation;
    pipe.group.rotation.y = -state.rotation * Math.PI / 2;
  } else {
    if (pipe) removePipe(index);
    if (state) addPipe(index % size, Math.floor(index / size), state.type, state.rotation);
  }
}

function updateHistoryButtons() {
  undoButton.disabled = !level.past.length;
  redoButton.disabled = !level.future.length;
}

function rememberEdit(changes) {
  if (!changes.length) return;
  level.past.push(changes);
  if (level.past.length > 80) level.past.shift();
  level.future.length = 0;
  updateHistoryButtons();
}

function replayEdit(undo) {
  const from = undo ? level.past : level.future;
  const to = undo ? level.future : level.past;
  if (!from.length) return false;
  const changes = from.pop();
  for (const { index, before, after } of changes) {
    applyPipeState(index, undo ? before : after);
  }
  to.push(changes);
  updateHistoryButtons();
  playSound('tap');
  updateFlow();
  if (selection && highlight.visible) select(...selection);
  return true;
}

undoButton.addEventListener('click', () => replayEdit(true));
redoButton.addEventListener('click', () => replayEdit(false));

function reset() {
  const changes = [];
  for (const [index, pipe] of level.pipes) {
    if (pipe.fixed) continue;
    changes.push({ index, before: pieceState(pipe), after: null });
    removePipe(index);
  }
  rememberEdit(changes);
  for (const machine of level.machines.values()) {
    machine.phase = machine.speed = 0;
    machine.animate(0, 0);
  }
  updateFlow();
}

function editable(x, z) {
  const index = key(x, z);
  return index !== level.sourceKey && !level.machines.has(index) && !level.blocked.has(index) && !level.pipes.get(index)?.fixed;
}

function act(x, z, action = tool) {
  if (coverState !== 'open') return;
  if (!drawerDiscovered) {
    drawerLatch.focus();
    return;
  }
  if (!editable(x, z)) return;
  const index = key(x, z);
  const pipe = level.pipes.get(index);
  const before = pieceState(pipe);
  let after;
  if (action === 'remove') {
    if (!pipe) return;
    after = null;
  } else if (pipe) {
    if (rotationCount[pipe.type] === 1) return;
    after = { type: pipe.type, rotation: (pipe.rotation + 1) % rotationCount[pipe.type] };
  } else if (action === 'rotate') {
    rotatePreview();
    return;
  } else if (canPlace(index, action)) {
    after = { type: action, rotation: previewRotation };
  } else return;
  applyPipeState(index, after);
  rememberEdit([{ index, before, after }]);
  if (after) snapPiece(x, z, after.type, after.rotation);
  else playSound('tap');
  updateFlow();
}

function canPlace(index, type) {
  return Object.hasOwn(pipePorts, type) && (!riseByPort[type] || heightAt(index) < maxHeight);
}

const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0x365f79, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false,
});
const ghostBrass = ghostMaterial.clone();
ghostBrass.color.setHex(0xd89c50);
ghostBrass.opacity = 0.74;
const previewModels = new Map();
let visibleGhost;
const previewMarkers = new THREE.Group();
const snapMarkers = new THREE.Group();
tray.add(previewMarkers, snapMarkers);
const ringShape = new THREE.TorusGeometry(0.082, 0.017, 7, 19);
const highMark = new THREE.OctahedronGeometry(0.068);
const fitColor = 0xffbe62;
const openColor = 0x8da6b9;
const highColor = 0x76d9f7;

function makeConnectionMarker(parent) {
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.74, depthWrite: false, toneMapped: false });
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(ringShape, material);
  const diamond = new THREE.Mesh(highMark, material);
  ring.rotation.x = -Math.PI / 2;
  diamond.position.y = 0.064;
  marker.add(ring, diamond);
  parent.add(marker);
  return { marker, diamond, material };
}

const previewLights = Array.from({ length: 4 }, () => makeConnectionMarker(previewMarkers));
const snapLights = Array.from({ length: 4 }, () => makeConnectionMarker(snapMarkers));
let snapTime = 0;

function positionMarkers(markers, x, z, type, rotation, onlyMatching) {
  const ports = piecePorts(type, rotation, heightAt(key(x, z)));
  for (const [i, { marker, diamond, material }] of markers.entries()) {
    const port = ports[i];
    marker.visible = false;
    if (!port) continue;
    const [dx, dz] = directions[port.direction];
    const matched = matchingPort(x + dx, z + dz, port.direction, port.height);
    if (onlyMatching && !matched) continue;
    marker.position.set(world(x) + dx * 0.445, pipeHeight + port.height * heightStep + 0.18, world(z) + dz * 0.445);
    marker.scale.setScalar(1);
    material.color.setHex(matched ? fitColor : port.raised ? highColor : openColor);
    material.opacity = matched ? 0.94 : 0.56;
    diamond.visible = port.raised;
    marker.visible = true;
  }
}

function snapPiece(x, z, type, rotation) {
  positionMarkers(snapLights, x, z, type, rotation, true);
  snapMarkers.visible = true;
  snapTime = 0.37;
  playSound('tap');
}

function animateSnap(dt) {
  snapTime = Math.max(0, snapTime - dt);
  snapMarkers.visible = snapTime > 0;
  if (!snapMarkers.visible) return;
  for (const { marker, material } of snapLights) {
    material.opacity = snapTime / 0.37;
    marker.scale.setScalar(1.5 - snapTime);
  }
}

function hidePreview() {
  if (visibleGhost) visibleGhost.visible = false;
  previewMarkers.visible = false;
}

function showPreview(x, z) {
  hidePreview();
  const index = key(x, z);
  if (!drawerDiscovered || !editable(x, z) || level.pipes.has(index) || !canPlace(index, tool)) return;
  if (!previewModels.has(tool)) {
    const model = new THREE.Group();
    buildPipeModel(model, tool, { body: ghostMaterial, collar: ghostBrass, rivet: ghostBrass, gasket: ghostMaterial });
    model.traverse(part => {
      part.castShadow = false;
      part.receiveShadow = false;
    });
    previewModels.set(tool, model);
    tray.add(model);
  }
  visibleGhost = previewModels.get(tool);
  visibleGhost.position.set(world(x), pipeHeight + heightAt(index) * heightStep, world(z));
  visibleGhost.rotation.y = -previewRotation * Math.PI / 2;
  visibleGhost.visible = true;
  positionMarkers(previewLights, x, z, tool, previewRotation, false);
  previewMarkers.visible = true;
}

function rotatePreview() {
  if (!drawerDiscovered || !Object.hasOwn(rotationCount, tool)) return;
  previewRotation = (previewRotation + 1) % rotationCount[tool];
  if (selection && highlight.visible) showPreview(...selection);
}

const highlight = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    [-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45],
  ].map(([x, z]) => new THREE.Vector3(x, 0.014, z))),
  new THREE.LineBasicMaterial({ color: 0x8cf1d9, toneMapped: false }),
);
highlight.visible = false;
tray.add(highlight);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selection;

function select(x, z) {
  selection = [x, z];
  showPreview(x, z);
  const index = key(x, z);
  const allowed = editable(x, z) && (level.pipes.has(index) || canPlace(index, tool));
  highlight.position.set(world(x), heightAt(index) * heightStep, world(z));
  highlight.material.color.setHex(allowed ? 0xffe1a0 : 0xc77e67);
  highlight.visible = true;
}

function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
  raycaster.setFromCamera(pointer, camera);
  if (coverState !== 'open') {
    if (coverState === 'opening') return null;
    const target = coverState === 'locked' ? coverLock : coverHinge;
    return raycaster.intersectObject(target).length ? { cover: true } : null;
  }
  const fixtureHit = inspectingLid ? null : raycaster.intersectObjects(level.group.children)[0];
  const tileHit = inspectingLid ? null : raycaster.intersectObjects(tiles)[0];
  const boardHit = fixtureHit && (!tileHit || fixtureHit.distance < tileHit.distance) ? fixtureHit : tileHit;
  const boxHit = raycaster.intersectObjects(inspectingLid ? [lid] : caseParts.children.filter(object => object.visible))[0];
  if (boxHit && (!boardHit || boxHit.distance < boardHit.distance)) {
    let object = boxHit.object;
    while (object !== caseParts) {
      if (object.userData.control) {
        const control = object.userData.control;
        return control.disabled() ? null : { control };
      }
      if (object.userData.latch) return { latch: true };
      if (object.userData.rewardLatch && rewardFraction > 0.65) return { rewardLatch: true };
      if (object.userData.tool && drawerOpen && drawerMotion > 0.82
          && !rackSlots.get(object.userData.tool).button.hidden) return { tool: object.userData.tool };
      object = object.parent;
    }
    return null;
  }
  if (!boardHit) return null;
  let object = boardHit.object;
  while (!object.userData.position && object.parent) object = object.parent;
  return { tile: object.userData.position };
}

const canvas = renderer.domElement;
let orbitDrag = null;
let suppressClick = false;

canvas.addEventListener('pointerdown', event => {
  suppressClick = false;
  if (event.pointerType !== 'mouse' || ![0, 2].includes(event.button)
      || coverState !== 'open' || inspectingLid) return;
  orbitDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
});

canvas.addEventListener('contextmenu', event => {
  if (coverState === 'open' && !inspectingLid) event.preventDefault();
});

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(type, event => {
    if (orbitDrag?.id !== event.pointerId) return;
    orbitDrag = null;
    canvas.style.cursor = '';
  });
}

canvas.addEventListener('wheel', event => {
  if (coverState !== 'open' || inspectingLid || event.ctrlKey) return;
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
  viewZoom = THREE.MathUtils.clamp(viewZoom * Math.exp(-delta * 0.0015), 0.75, 2.35);
  syncViewButtons();
  resize();
}, { passive: false });

canvas.addEventListener('pointermove', event => {
  if (orbitDrag?.id === event.pointerId) {
    if (!event.buttons) orbitDrag = null;
    else {
      const dx = event.clientX - orbitDrag.x;
      const dy = event.clientY - orbitDrag.y;
      if (!orbitDrag.active && Math.hypot(dx, dy) < 5) return;
      if (!orbitDrag.active) {
        orbitDrag.active = true;
        canvas.setPointerCapture(event.pointerId);
        suppressClick = true;
        stage.focus({ preventScroll: true });
        hoveredControl = null;
        highlight.visible = false;
        hidePreview();
        canvas.style.cursor = 'grabbing';
        if (overhead) {
          orbitYaw = -level.view[0];
          orbitTilt = 82 - level.view[1];
          overhead = false;
        }
      }
      orbitDrag.x = event.clientX;
      orbitDrag.y = event.clientY;
      orbitYaw = THREE.MathUtils.euclideanModulo(orbitYaw - dx * 0.42 + 180, 360) - 180;
      orbitTilt = THREE.MathUtils.clamp(level.view[1] + orbitTilt + dy * 0.28, 30, 86) - level.view[1];
      aimCamera();
      syncViewButtons();
      resize();
      return;
    }
  }
  if (event.pointerType !== 'mouse') return;
  const hit = pick(event);
  hoveredControl = hit?.control ?? null;
  renderer.domElement.style.cursor = hit?.tool || hit?.latch || hit?.rewardLatch || hit?.control || hit?.cover ? 'pointer' : '';
  if (hit?.tile) select(...hit.tile);
  else {
    highlight.visible = false;
    hidePreview();
  }
});
renderer.domElement.addEventListener('pointerleave', () => {
  if (orbitDrag?.active) return;
  orbitDrag = null;
  hoveredControl = null;
  if (touchPreview !== null) return;
  highlight.visible = false;
  hidePreview();
  renderer.domElement.style.cursor = '';
});
renderer.domElement.addEventListener('click', event => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const hit = pick(event);
  if (hit?.cover) advanceCover();
  else if (hit?.control) {
    touchPreview = null;
    highlight.visible = false;
    hidePreview();
    hit.control.invoke();
    playSound('tap');
  } else if (hit?.latch) toggleDrawer();
  else if (hit?.rewardLatch) toggleReward();
  else if (hit?.tool) selectTool(hit.tool);
  else if (hit?.tile) {
    const [x, z] = hit.tile;
    const index = key(x, z);
    if (event.pointerType === 'touch' && drawerDiscovered && editable(x, z)
        && !level.pipes.has(index) && canPlace(index, tool) && touchPreview !== index) {
      touchPreview = index;
      select(x, z);
      return;
    }
    touchPreview = null;
    act(x, z);
    select(x, z);
  }
});
stage.addEventListener('focus', () => { if (!inspectingLid && coverState === 'open') select(...selection); });
stage.addEventListener('blur', event => {
  if (event.relatedTarget === turnPiece) return;
  touchPreview = null;
  highlight.visible = false;
  hidePreview();
});
turnPiece.addEventListener('click', rotatePreview);
stage.addEventListener('keydown', event => {
  if (coverState !== 'open') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advanceCover();
    }
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    homeButton.click();
    return;
  }
  if (inspectingLid) {
    if (event.key === 'Escape') {
      event.preventDefault();
      toggleLidInspection();
    }
    return;
  }
  const pressed = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && !event.altKey && ['z', 'y'].includes(pressed)) {
    event.preventDefault();
    replayEdit(pressed === 'z' && !event.shiftKey);
    return;
  }
  const moves = { ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowUp: [0, -1] };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    const direction = directions.findIndex(([x, z]) => x === move[0] && z === move[1]);
    const boardMove = directions[(direction - viewTurns + 4) % 4];
    const [x, z] = selection.map((value, i) => THREE.MathUtils.clamp(value + boardMove[i], 0, size - 1));
    select(x, z);
  } else if (['Enter', ' ', 'r', 'R', 'Delete', 'Backspace'].includes(event.key)) {
    event.preventDefault();
    const action = { r: 'rotate', R: 'rotate', Delete: 'remove', Backspace: 'remove' }[event.key] ?? tool;
    act(...selection, action);
    select(...selection);
  }
});

function buildRemovalTongs(parent) {
  const jawOutline = new THREE.Shape();
  jawOutline.moveTo(-0.047, -0.105);
  jawOutline.bezierCurveTo(0.025, -0.135, 0.075, -0.096, 0.108, -0.037);
  jawOutline.bezierCurveTo(0.178, 0.049, 0.292, 0.131, 0.302, 0.286);
  jawOutline.bezierCurveTo(0.314, 0.394, 0.238, 0.473, 0.102, 0.47);
  jawOutline.quadraticCurveTo(0.058, 0.465, 0.061, 0.421);
  jawOutline.bezierCurveTo(0.163, 0.424, 0.213, 0.379, 0.213, 0.296);
  jawOutline.bezierCurveTo(0.210, 0.209, 0.152, 0.156, 0.060, 0.103);
  jawOutline.quadraticCurveTo(-0.060, 0.054, -0.067, -0.028);
  jawOutline.quadraticCurveTo(-0.072, -0.072, -0.047, -0.105);
  jawOutline.closePath();
  const forgedJaw = new THREE.ExtrudeGeometry(jawOutline, {
    depth: 0.039, bevelEnabled: true, bevelThickness: 0.013, bevelSize: 0.014, bevelSegments: 3,
  });
  forgedJaw.rotateX(-Math.PI / 2);

  const handleShape = new THREE.LatheGeometry([
    [0.031, -0.50], [0.045, -0.46], [0.046, -0.29], [0.058, -0.12],
    [0.064, 0.22], [0.058, 0.38], [0.041, 0.48], [0, 0.50],
  ].map(([radius, length]) => new THREE.Vector2(radius, length)), 20);

  for (const side of [-1, 1]) {
    const half = new THREE.Group();
    half.scale.x = side;
    parent.add(half);
    mesh(forgedJaw, rackGold, half, 0, side * 0.011 - 0.009, 0);
    for (const [x, z] of [[0.179, -0.165], [0.207, -0.208], [0.223, -0.257], [0.227, -0.31], [0.204, -0.361]]) {
      const tooth = castBlock(half, rackSteel, 0.038, 0.014, 0.019, x, side * 0.011 + 0.035, z, 0.004);
      tooth.rotation.y = -0.34;
    }
    const spine = cylinder(half, bronze, 0.034, 1, 0, 0, 0);
    positionRod(spine, new THREE.Vector3(0.017, 0.016, 0.026), new THREE.Vector3(0.17, 0.012, 0.268));
    const grip = mesh(handleShape, frame, half);
    const gripStart = new THREE.Vector3(0.124, 0.012, 0.152);
    const gripEnd = new THREE.Vector3(0.298, 0.012, 0.538);
    positionRod(grip, gripStart, gripEnd);
    for (const [offset, radius] of [[0.077, 0.049], [0.865, 0.055]]) {
      const center = gripStart.clone().lerp(gripEnd, offset);
      const collar = cylinder(half, rackGold, radius, 0.036, center.x, center.y, center.z);
      collar.quaternion.copy(grip.quaternion);
    }
  }
  cylinder(parent, bronze, 0.074, 0.086, 0, 0.021, 0);
  cylinder(parent, rackGold, 0.054, 0.025, 0, 0.074, 0);
  box(parent, dark, 0.058, 0.003, 0.010, 0, 0.088, 0).rotation.y = -0.44;
}

const buttons = [...document.querySelectorAll('[data-tool]')];
const caseParts = new THREE.Group();
scene.add(caseParts);
castBlock(caseParts, frame, boxWidth + 0.22, 0.16, boxWidth + 0.20, 0, -1.62, 0, 0.06);
castBlock(caseParts, frame, boxWidth + 0.13, 0.13, boxWidth + 0.10, 0, -1.013, 0, 0.046);
castBlock(caseParts, frame, boxWidth + 0.11, 0.50, 0.23, 0, -1.30, -3.55 - rimOffset, 0.052);
for (const x of [-4.24, 4.24]) {
  castBlock(caseParts, frame, 0.26, 0.52, boxWidth + 0.08, x, -1.30, 0, 0.052);
  box(caseParts, inlay, 0.016, 0.020, boxWidth - 0.14, x * 1.028, -1.43, 0);
}
const drawer = new THREE.Group();
const closedDrawerZ = 2.98 + rimOffset;
const revealedDrawerZ = 4.30 + rimOffset;
drawer.position.set(0, -1.46, closedDrawerZ);
caseParts.add(drawer);
castBlock(drawer, frame, boxWidth - 0.31, 0.10, 1.52, 0, -0.055, 0, 0.034);
castBlock(drawer, frame, boxWidth - 0.19, 0.40, 0.185, 0, 0.125, 0.72, 0.043);
castBlock(drawer, velvet, boxWidth - 0.43, 0.079, 1.25, 0, 0.027, -0.016, 0.024);
for (const x of [-4.06, 4.06]) {
  castBlock(drawer, brass, 0.048, 0.053, 1.18, x, 0.054, -0.08, 0.016);
}
const handleAssembly = new THREE.Group();
handleAssembly.position.set(0, 0.128, 0.826);
handleAssembly.userData.latch = true;
drawer.add(handleAssembly);
castBlock(handleAssembly, bronze, 0.78, 0.237, 0.044, 0, 0, 0, 0.017);
const handleRing = mesh(new THREE.TorusGeometry(0.108, 0.022, 10, 26), inlay, handleAssembly, 0, 0, 0.045);
handleRing.scale.x = 1.8;
for (const x of [-0.247, 0.247]) mesh(rivetGeometry, brass, handleAssembly, x, 0, 0.032);
mesh(crestGeometry, inlay, handleAssembly, 0, 0, 0.054).scale.setScalar(0.63);

const rackSteel = material(0x79828b, 0.70, 0.25);
const rackGold = material(0xe2ae66, 0.72, 0.27);
const rackCopper = material(0xbb7952, 0.63, 0.33);
for (const finish of [rackSteel, rackGold, rackCopper]) {
  Object.assign(finish, { bumpMap: brushedTexture.bumpMap, bumpScale: 0.006 });
}
// Display the loose fittings as a jeweller would lay them out. Their routing orientation stays unchanged.
function seatDisplayPiece(model, type, deck, maxWidth, maxDepth, maxScale, z = 0) {
  if (type === 'riser') model.rotation.set(Math.PI / 2, -0.13, 0, 'YXZ');
  else if (type === 'riser-elbow') model.rotation.set(-0.98, -0.22, 0, 'YXZ');
  else if (type === 'remove') model.rotation.y = -0.37;
  const bounds = new THREE.Box3().setFromObject(model, true);
  const span = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(maxScale, maxWidth / span.x, maxDepth / span.z, 0.28 / span.y);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, deck - bounds.min.y * scale, z - center.z * scale);
}

const selectedLining = material(0x464d83, 0.08, 0.86);
const emptyLining = material(0x0d132d, 0.07, 0.97);
const rackSlots = new Map();
for (const [index, button] of buttons.entries()) {
  const type = button.dataset.tool;
  const slot = new THREE.Group();
  slot.position.x = (index - 3) * 1.15;
  slot.userData.tool = type;
  drawer.add(slot);
  const cushion = castBlock(slot, emptyLining, 1.05, 0.072, 1.09, 0, 0.075, -0.065, 0.023);
  box(slot, bronze, 0.72, 0.012, 0.024, 0, 0.117, 0.458);
  const model = new THREE.Group();
  if (type === 'remove') {
    buildRemovalTongs(model);
  } else {
    buildPipeModel(model, type, { body: riseByPort[type] ? rackCopper : rackSteel, collar: rackGold, rivet: bronze });
  }
  seatDisplayPiece(model, type, 0.114, 0.87, 0.84, type === 'remove' ? 0.89 : riseByPort[type] ? 0.73 : 0.65, -0.055);
  slot.add(model);
  rackSlots.set(type, { model, cushion, button });
}

let drawerMotion = 0;
function toggleDrawer() {
  if (coverState !== 'open') return;
  const focusWasInRack = drawerPanel.contains(document.activeElement);
  drawerOpen = !drawerOpen;
  drawerDiscovered ||= drawerOpen;
  if (drawerOpen) selectTool(tool);
  drawerLatch.setAttribute('aria-expanded', String(drawerOpen));
  drawerLabel.textContent = drawerOpen ? 'Stow pipe rack' : drawerDiscovered ? 'Open pipe rack' : 'Release pipe rack';
  drawerPanel.inert = !drawerOpen;
  drawerPanel.classList.toggle('revealed', drawerOpen);
  recordProgress();
  if (!drawerOpen && focusWasInRack) drawerLatch.focus();
}

function moveDrawer(dt) {
  const target = drawerOpen ? 1 : 0;
  if (target === drawerMotion) return;
  drawerMotion += Math.sign(target - drawerMotion) * Math.min(dt * 2.7, Math.abs(target - drawerMotion));
  const progress = drawerMotion * drawerMotion * (3 - 2 * drawerMotion);
  drawer.position.z = THREE.MathUtils.lerp(closedDrawerZ, revealedDrawerZ, progress);
  handleRing.rotation.x = -0.43 * Math.sin(progress * Math.PI);
  resize();
}

function selectTool(type) {
  const slot = rackSlots.get(type);
  if (!slot || slot.button.hidden) return;
  if (tool !== type) {
    previewRotation = level.tutorial && type === 'elbow' ? 2 : 0;
    touchPreview = null;
  }
  tool = type;
  turnPiece.disabled = !drawerDiscovered || (rotationCount[type] ?? 1) <= 1;
  for (const [name, { button, cushion }] of rackSlots) {
    const selected = name === type;
    button.setAttribute('aria-pressed', String(selected));
    cushion.material = selected ? selectedLining : emptyLining;
  }
  if (drawerDiscovered) selectedTool.textContent = slot.button.textContent.trim();
  if (highlight.visible) select(...selection);
}

drawerLatch.addEventListener('click', toggleDrawer);
for (const button of buttons) {
  button.addEventListener('click', () => selectTool(button.dataset.tool));
}

const milestones = new Map([
  [0, { type: 'tee', label: 'Tee', board: 'Split Shift' }],
  [3, { type: 'cross', label: 'Cross', board: 'Cross Pressure' }],
  [5, { type: 'riser', label: 'Riser', board: 'First Rise' }],
  [7, { type: 'riser-elbow', label: 'Riser elbow', board: 'Casting Yard' }],
]);
const rewardDrawer = new THREE.Group();
rewardDrawer.visible = false;
rewardDrawer.position.y = -1.51;
caseParts.add(rewardDrawer);
castBlock(rewardDrawer, frame, 1.24, 0.11, 1.27, 0, -0.008, 0, 0.035);
castBlock(rewardDrawer, velvet, 1.11, 0.066, 1.12, 0, 0.061, 0, 0.021);
castBlock(rewardDrawer, bronze, 0.145, 0.36, 1.13, 0.595, 0.13, 0, 0.029);
const rewardPull = new THREE.Group();
rewardPull.userData.rewardLatch = true;
rewardPull.position.set(0.68, 0.145, 0);
rewardDrawer.add(rewardPull);
const rewardKnob = mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.078, 6), brass, rewardPull);
rewardKnob.rotation.z = Math.PI / 2;
const pearl = mesh(new THREE.SphereGeometry(0.057, 12, 8), enamelBlue, rewardPull, 0.044, 0, 0);
pearl.scale.x = 0.40;
const rewardModels = new Map();
for (const { type } of milestones.values()) {
  const model = new THREE.Group();
  buildPipeModel(model, type, { body: riseByPort[type] ? rackCopper : rackSteel, collar: rackGold, rivet: bronze });
  seatDisplayPiece(model, type, 0.097, 0.89, 0.87, 0.77);
  model.visible = false;
  rewardModels.set(type, model);
  rewardDrawer.add(model);
}
let rewardOpen = false;
let rewardFraction = 0;
let activeMilestone = null;

function setRewardDrawer(open) {
  rewardOpen = open;
  rewardLatch.setAttribute('aria-expanded', String(open));
  rewardLatch.textContent = open ? 'Stow fitting' : 'Reveal fitting';
}

function toggleReward() {
  if (!level.rewardShown) return;
  setRewardDrawer(!rewardOpen);
  playSound('latch');
}

rewardLatch.addEventListener('click', toggleReward);

function showMilestone() {
  level.rewardShown = true;
  rewardPlate.hidden = false;
  recordProgress();
  rewardLabel.textContent = `${activeMilestone.label} revealed · Used from ${activeMilestone.board}`;
  setRewardDrawer(true);
  playSound('latch');
}

function animateReward(elapsed) {
  if (powered && level.completionTime < 1.65) {
    level.completionTime += elapsed;
    if (level.completionTime >= 1.65 && activeMilestone && !level.rewardShown) showMilestone();
  }
  const target = rewardOpen ? 1 : 0;
  if (rewardFraction === target) return;
  rewardFraction += Math.sign(target - rewardFraction)
    * Math.min(elapsed * 1.82, Math.abs(target - rewardFraction));
  const progress = rewardFraction * rewardFraction * (3 - 2 * rewardFraction);
  const side = Math.sign(level.view[0]);
  rewardDrawer.visible = rewardFraction > 0;
  rewardDrawer.position.set(side * (rimOffset + THREE.MathUtils.lerp(3.03, 4.22, progress)), -1.51, 0.94);
  rewardDrawer.rotation.y = side > 0 ? 0 : Math.PI;
  rewardKnob.rotation.x = progress * Math.PI * 1.5;
  resize();
}

function prepareMilestone(index) {
  activeMilestone = milestones.get(index) ?? null;
  rewardDrawer.visible = false;
  rewardFraction = 0;
  rewardPlate.hidden = !level.rewardShown;
  for (const [type, model] of rewardModels) {
    model.visible = type === activeMilestone?.type;
  }
  if (level.rewardShown) {
    rewardLabel.textContent = `${activeMilestone.label} revealed · Used from ${activeMilestone.board}`;
  }
  setRewardDrawer(false);
}

// Layered cloud profiles give each sprite both a shaded interior and a lit edge.
function makeVaporTexture(variant) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const context = canvas.getContext('2d');
  const image = context.createImageData(96, 96);
  const seed = randomTextureSample();
  for (let i = 0; i < variant * 31; i++) seed();
  const clouds = noiseField(7, 7, seed);
  const billows = noiseField(15, 15, seed);
  const grain = noiseField(29, 29, seed);

  function density(u, v) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const envelope = 1 - Math.hypot(x * 1.06, y * 1.02);
    const channels = (clouds(u, v) - 0.5) * 0.56
      + (billows(u, v) - 0.5) * 0.27 + (grain(u, v) - 0.5) * 0.11;
    const edge = THREE.MathUtils.smoothstep(envelope, 0, 0.29);
    return edge * THREE.MathUtils.smoothstep(envelope * 0.58 + channels, 0.015, 0.51);
  }

  const shadow = [97, 113, 134];
  const light = [244, 246, 240];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = (x + 0.5) / canvas.width;
      const v = (y + 0.5) / canvas.height;
      const depth = density(u, v);
      const upperDensity = density(Math.max(0, u - 0.041), Math.max(0, v - 0.061));
      const shading = THREE.MathUtils.clamp(0.61 - 0.37 * depth
        + 1.12 * (depth - upperDensity) + (clouds(u, v) - 0.5) * 0.51, 0.02, 1);
      const offset = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        image.data[offset + channel] = THREE.MathUtils.lerp(shadow[channel], light[channel], shading);
      }
      image.data[offset + 3] = Math.round(236 * Math.pow(depth, 0.81));
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const vaporTextures = Array.from({ length: 5 }, (_, index) => makeVaporTexture(index));
const steamProfiles = {
  jet:   { speed: 1.72, lift: 0.28, curl: 0.23, life: 1.18, size: 0.25, growth: 0.71, opacity: 0.90 },
  vent:  { speed: 0.00, lift: 0.66, curl: 0.18, life: 1.34, size: 0.22, growth: 0.59, opacity: 0.81 },
  boiler: { speed: 0, lift: 0.91, curl: 0.25, life: 1.13, size: 0.16, growth: 0.52, opacity: 0.86 },
  seam:  { speed: 0.76, lift: 0.33, curl: 0.19, life: 0.82, size: 0.19, growth: 0.38, opacity: 0.66 },
};
const particles = Array.from({ length: 112 }, () => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vaporTextures[0], transparent: true, depthWrite: false, toneMapped: false,
  }));
  sprite.visible = false;
  tray.add(sprite);
  return { sprite };
});

let nextParticle = 0;
let jetClock = 0;
let ventClock = 0;
let nextWisp = 0.84;
let boilerCycle = 0;
let boilerPuffClock = 0;

function emitSteam(outlet, kind) {
  const particle = particles[nextParticle];
  nextParticle = (nextParticle + 1) % particles.length;
  const profile = steamProfiles[kind];
  const speed = profile.speed * (0.85 + Math.random() * 0.30);
  particle.profile = profile;
  particle.age = 0;
  particle.life = profile.life * (0.89 + Math.random() * 0.26);
  particle.dx = (outlet.dx ?? 0) * speed;
  particle.dz = (outlet.dz ?? 0) * speed;
  particle.phase = Math.random() * Math.PI * 2;
  particle.twist = (Math.random() - 0.5) * 1.5;
  particle.sprite.position.set(outlet.x, outlet.y, outlet.z);
  particle.sprite.material.map = vaporTextures[Math.floor(Math.random() * vaporTextures.length)];
  particle.sprite.material.rotation = (Math.random() - 0.5) * 1.7;
  particle.sprite.visible = true;
}

function animateBoiler(dt) {
  const pressure = THREE.MathUtils.clamp(level.pressure / 100, 0, 1);
  boilerCycle = (boilerCycle + dt * (0.34 + pressure * 0.34)) % 1;
  const opening = powered ? 0 : THREE.MathUtils.smoothstep(boilerCycle, 0.55, 0.70)
    * (1 - THREE.MathUtils.smoothstep(boilerCycle, 0.85, 0.99));
  if (level.valve) {
    const angle = pressure * 1.75 + opening * (0.30 + pressure * 0.28);
    level.valve.rotation.z = THREE.MathUtils.damp(level.valve.rotation.z, angle, 7, dt);
  }

  if (pressure < 0.09 || opening < 0.45) {
    boilerPuffClock = 0;
    return;
  }
  boilerPuffClock -= dt;
  if (boilerPuffClock <= 0) {
    emitSteam(level.vent, 'boiler');
    boilerPuffClock = THREE.MathUtils.lerp(0.105, 0.040, pressure);
  }
}

function animateSteam(dt, elapsed) {
  animateBoiler(Math.min(elapsed, 0.20));
  const jetInterval = 0.047;
  const ventInterval = 0.089;
  jetClock += dt;
  ventClock += dt;
  const jetReady = jetClock >= jetInterval;
  const ventReady = ventClock >= ventInterval;
  if (jetReady) jetClock %= jetInterval;
  if (ventReady) ventClock %= ventInterval;
  if (jetReady || ventReady) {
    for (const outlet of outlets) {
      const isJet = Boolean(outlet.dx || outlet.dz);
      if (isJet ? jetReady : ventReady) emitSteam(outlet, isJet ? 'jet' : 'vent');
    }
  }
  if (warmJoints.length) {
    nextWisp -= dt;
    if (nextWisp <= 0) {
      nextWisp = 0.85 + Math.random() * 1.5;
      emitSteam(warmJoints[Math.floor(Math.random() * warmJoints.length)], 'seam');
    }
  }

  for (const particle of particles) {
    if (!particle.sprite.visible) continue;
    particle.age += dt;
    const { sprite, age, profile, life, dx, dz, phase, twist } = particle;
    const progress = age / life;
    if (progress >= 1) {
      sprite.visible = false;
      continue;
    }
    // Steam has its strongest push at the mouth, then curls and rises as it mixes with the air.
    const thrust = Math.exp(-age * 2.35);
    const roll = profile.curl * (0.14 + progress * 0.86);
    const spread = phase + age * 4.8;
    sprite.position.x += (dx * thrust + Math.cos(spread) * roll) * dt;
    sprite.position.z += (dz * thrust + Math.sin(spread) * roll) * dt;
    sprite.position.y += (profile.lift * (0.68 + 0.64 * progress) + 0.095 * Math.sin(spread)) * dt;
    const bloom = profile.size + profile.growth * Math.pow(progress, 0.78);
    sprite.scale.set(bloom * (0.95 + 0.13 * Math.sin(phase)), bloom * (0.86 + 0.35 * progress), 1);
    sprite.material.rotation += twist * (0.42 + progress) * dt;
    const condense = 0.67 + 0.33 * THREE.MathUtils.smoothstep(progress, 0, 0.18);
    const disperse = 1 - THREE.MathUtils.smoothstep(progress, 0.23, 1);
    sprite.material.opacity = profile.opacity * condense * disperse;
  }
}

function makeGoldGlint() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const pen = canvas.getContext('2d');
  const glow = pen.createRadialGradient(32, 32, 0, 32, 32, 30);
  glow.addColorStop(0, '#fff8d3');
  glow.addColorStop(0.23, '#ffd47c9d');
  glow.addColorStop(1, '#ce712200');
  pen.fillStyle = glow;
  pen.fillRect(0, 0, 64, 64);
  pen.fillStyle = '#fff1b5';
  pen.beginPath();
  for (const [x, y] of [[32, 3], [35, 29], [53, 32], [35, 35],
    [32, 61], [29, 35], [11, 32], [29, 29]]) pen.lineTo(x, y);
  pen.closePath();
  pen.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const glintTexture = makeGoldGlint();
const glints = Array.from({ length: size * size }, () => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glintTexture, transparent: true, depthWrite: false, toneMapped: false,
  }));
  sprite.visible = false;
  tray.add(sprite);
  return sprite;
});
let celebration = null;

function startCelebration(depth) {
  const effects = [...depth].map(([index, distance], i) => {
    const sprite = glints[i];
    const fixture = index === level.sourceKey || level.machines.has(index);
    const height = heightAt(index) * heightStep + pipeHeight + (fixture ? 0.62 : 0.14);
    return {
      sprite, x: world(index % size), z: world(Math.floor(index / size)),
      height, delay: distance * 0.082, size: fixture ? 0.69 : 0.45,
    };
  });
  celebration = { effects, time: 0, started: false };
}

function stopCelebration() {
  if (celebration) {
    for (const { sprite } of celebration.effects) sprite.visible = false;
    celebration = null;
  }
  stopCompletionTune();
}

function animateCelebration(elapsed) {
  if (!celebration) return;
  celebration.time += elapsed;
  const time = celebration.time - 0.42;
  if (time < 0) return;
  if (!celebration.started) {
    celebration.started = true;
    level.celebrated = true;
    playCompletionTune();
  }
  let finished = true;
  for (const { sprite, x, z, height, delay, size: scale } of celebration.effects) {
    const phase = (time - delay) / 0.65;
    finished &&= phase >= 1;
    sprite.visible = phase > 0 && phase < 1;
    if (!sprite.visible) continue;
    const shine = Math.sin(Math.PI * phase);
    sprite.material.opacity = shine;
    sprite.material.rotation = phase * 0.65;
    sprite.position.set(x - phase * 0.09, height + phase * 0.24, z);
    sprite.scale.setScalar(scale * (0.44 + 0.56 * shine));
  }
  if (finished) celebration = null;
}

let audio = null;
let noiseBuffer = null;
let muted = false;
let nextChuff = 0;

function enableSound(event) {
  if (muted || (event && !event.isTrusted)) return;
  if (!audio && window.AudioContext) {
    audio = new AudioContext();
    noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.48), audio.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  }
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
}

window.addEventListener('pointerdown', enableSound);
window.addEventListener('keydown', enableSound);
soundButton.addEventListener('click', () => {
  muted = !muted;
  soundButton.setAttribute('aria-pressed', String(muted));
  soundButton.textContent = muted ? 'Sound off' : 'Sound on';
  if (muted) stopCompletionTune();
  else enableSound();
});

// An original eight-bar court dance for a pinned music box, in three beats to the bar.
const completionMelody = [
  [[74, 0], [78, 1], [81, 2], [79, 2.5]],
  [[78, 0], [76, 1], [74, 2]],
  [[76, 0], [79, 1], [83, 2], [81, 2.5]],
  [[79, 0], [78, 1], [76, 2]],
  [[81, 0], [86, 1], [85, 2], [83, 2.5]],
  [[81, 0], [79, 1], [78, 2]],
  [[76, 0], [79, 0.5], [81, 1], [85, 2]],
  [[86, 0], [81, 0.5], [78, 1], [74, 2]],
];
const completionBass = [
  [50, 57, 62], [54, 57, 62], [55, 59, 62], [52, 59, 64],
  [54, 57, 62], [55, 59, 62], [57, 64, 67], [50, 57, 62],
];
let completionAudio = null;

function stopCompletionTune() {
  if (!completionAudio) return;
  const { bus, voices } = completionAudio;
  completionAudio = null;
  const now = audio.currentTime;
  bus.gain.setTargetAtTime(0, now, 0.025);
  for (const voice of voices) voice.stop(now + 0.12);
}

function playCompletionTune() {
  if (muted || audio?.state !== 'running') return;
  stopCompletionTune();
  const bus = audio.createGain();
  bus.gain.value = 0.8;
  bus.connect(audio.destination);
  const voices = new Set();
  completionAudio = { bus, voices };
  const tines = audio.createPeriodicWave(
    new Float32Array(5), new Float32Array([0, 1, 0.19, 0.28, 0.08]),
  );
  const beat = 0.40;
  const intro = audio.currentTime + 0.045;
  const pluck = (pitch, offset, treble) => {
    const start = intro + offset * beat;
    const note = audio.createOscillator();
    const envelope = audio.createGain();
    const decay = treble ? 0.76 : 0.43;
    if (treble) note.setPeriodicWave(tines);
    note.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
    envelope.gain.setValueAtTime(0.001, start);
    envelope.gain.exponentialRampToValueAtTime(treble ? 0.112 : 0.047, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(treble ? 0.029 : 0.013, start + 0.13);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + decay);
    note.connect(envelope).connect(bus);
    note.start(start);
    note.stop(start + decay + 0.02);
    voices.add(note);
    note.onended = () => {
      voices.delete(note);
      note.disconnect();
      envelope.disconnect();
      if (voices.size === 0) {
        bus.disconnect();
        if (completionAudio?.bus === bus) completionAudio = null;
      }
    };
  };
  for (const [bar, notes] of completionMelody.entries()) {
    for (const [pitch, offset] of notes) pluck(pitch, bar * 3 + offset, true);
    for (const [offset, pitch] of completionBass[bar].entries()) pluck(pitch, bar * 3 + offset, false);
  }
}

function playSound(kind) {
  if (muted || audio?.state !== 'running') return;
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);
  if (kind === 'chime') {
    for (const [i, frequency] of [523.25, 659.25, 783.99].entries()) {
      const start = now + i * 0.095;
      const tone = audio.createOscillator();
      const envelope = audio.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.001, start);
      envelope.gain.exponentialRampToValueAtTime(0.075, start + 0.024);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.43);
      tone.connect(envelope).connect(gain);
      tone.start(start);
      tone.stop(start + 0.45);
    }
    return;
  }
  if (kind === 'tap' || kind === 'latch') {
    const tone = audio.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(kind === 'latch' ? 520 : 970, now);
    tone.frequency.exponentialRampToValueAtTime(kind === 'latch' ? 185 : 430, now + 0.064);
    gain.gain.setValueAtTime(kind === 'latch' ? 0.085 : 0.042, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.094);
    tone.connect(gain);
    tone.start(now);
    tone.stop(now + 0.10);
    return;
  }
  const puff = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const duration = kind === 'hiss' ? 0.44 : 0.15;
  puff.buffer = noiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.value = kind === 'hiss' ? 1720 : 235;
  filter.Q.value = 0.85;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(kind === 'hiss' ? 0.082 : 0.05, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  puff.connect(filter).connect(gain);
  puff.start(now);
  puff.stop(now + duration);
}

function animateMachine(dt, elapsed) {
  let running = false;
  for (const machine of level.machines.values()) {
    if (machine.powered) machine.startup += elapsed;
    const ramp = machine.powered ? THREE.MathUtils.smoothstep(machine.startup, 0.22, 1.75) : 0;
    machine.speed = THREE.MathUtils.damp(machine.speed, ramp * 10, 4, dt);
    machine.phase += machine.speed * dt;
    machine.animate(machine.phase, machine.speed);
    machine.lampMaterial.emissiveIntensity = machine.powered ? 0.36 + ramp * 1.44 : 0;
    machine.lampLight.intensity = machine.powered ? 0.23 + ramp * 1.52 : 0;
    running ||= machine.powered && machine.speed > 2;
  }
  nextChuff -= dt;
  if (running && nextChuff <= 0) {
    playSound('chuff');
    nextChuff = 0.59;
  }
}

let gaugeTime = 0;
function animateGauge(elapsed) {
  const target = level.targetPressure;
  // Advance the damped spring in real time, even when a frame takes longer to render.
  const damping = 1.25;
  const frequency = 1.48;
  const offset = level.pressure - target;
  const sineWeight = (level.pressureVelocity + damping * offset) / frequency;
  const sine = Math.sin(frequency * elapsed);
  const cosine = Math.cos(frequency * elapsed);
  const decay = Math.exp(-damping * elapsed);
  const wave = offset * cosine + sineWeight * sine;
  level.pressure = target + decay * wave;
  level.pressureVelocity = decay * (frequency * (sineWeight * cosine - offset * sine) - damping * wave);
  gaugeTime += elapsed;
  const flutter = (Math.sin(gaugeTime * 5.4) * 11 + Math.sin(gaugeTime * 8.7) * 2) * Math.min(1, target / 19);
  // Leave room past the last tick so the needle can rebound at full pressure.
  const sweep = -120 + 2.4 * THREE.MathUtils.clamp(level.pressure, -3, 103);
  level.gaugeNeedle.rotation.z = -THREE.MathUtils.degToRad(sweep + flutter);
  lidNeedle.rotation.z = -THREE.MathUtils.degToRad(sweep + flutter * 0.25);
  pressureHand.style.transform = `rotate(${(sweep + flutter * 0.19).toFixed(2)}deg)`;
}

function boxCorners({ min, max }) {
  return [min.x, max.x].flatMap(x => [min.y, max.y].flatMap(y =>
    [min.z, max.z].map(z => new THREE.Vector3(x, y, z)),
  ));
}

const boardBounds = boxCorners({
  min: new THREE.Vector3(-(3.7 + rimOffset), -0.91, -3.7 - rimOffset),
  max: new THREE.Vector3((3.7 + rimOffset), 0.08, 3.7 + rimOffset),
});
const caseBounds = boxCorners({
  min: new THREE.Vector3(-(3.74 + rimOffset), -1.71, -3.73 - rimOffset),
  max: new THREE.Vector3((3.74 + rimOffset), -0.94, 3.73 + rimOffset),
});
const rackBounds = boxCorners({
  min: new THREE.Vector3(-(3.55 + rimOffset), -0.105, -0.76),
  max: new THREE.Vector3((3.55 + rimOffset), 0.68, 0.91),
});
const rewardBounds = boxCorners({
  min: new THREE.Vector3(-0.63, -0.06, -0.66),
  max: new THREE.Vector3(0.79, 0.99, 0.66),
});
const cameraPoint = new THREE.Vector3();
let turnStart = 0;
let turnTarget = 0;
let turnProgress = 1;
let renderWidth = 0;
let renderHeight = 0;

function turnTray(dt) {
  if (turnProgress >= 1) return;
  turnProgress = Math.min(1, turnProgress + dt * 3.8);
  const eased = turnProgress * turnProgress * (3 - 2 * turnProgress);
  tray.rotation.y = THREE.MathUtils.lerp(turnStart, turnTarget, eased);
  resize();
}

function resize() {
  const { clientWidth: width, clientHeight: height } = stage;
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  tray.updateWorldMatrix(true, false);
  drawer.updateWorldMatrix(true, false);
  const fitCorners = (points, transform) => {
    for (const corner of points) {
      cameraPoint.copy(corner);
      if (transform) cameraPoint.applyMatrix4(transform);
      cameraPoint.applyMatrix4(camera.matrixWorldInverse);
      const x = cameraPoint.x / -cameraPoint.z;
      const y = cameraPoint.y / -cameraPoint.z;
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
  };
  if (lid.visible) fitCorners(lidBounds);
  if (coverHinge.visible && !inspectingLid) {
    coverHinge.updateMatrixWorld();
    for (const leaf of coverLeaves) fitCorners(coverBounds, leaf.matrixWorld);
  }
  if (!inspectingLid) {
    fitCorners(boardBounds, tray.matrixWorld);
    if (level.group.visible) fitCorners(level.fixtureBounds, tray.matrixWorld);
    fitCorners(caseBounds);
    fitCorners(rackBounds, drawer.matrixWorld);
    if (rewardDrawer.visible) {
      rewardDrawer.updateWorldMatrix(true, false);
      fitCorners(rewardBounds, rewardDrawer.matrixWorld);
    }
  }
  const halfHeight = Math.max((top - bottom) / 1.72, (right - left) / (1.84 * aspect)) / (inspectingLid ? 1 : viewZoom);
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight));
  camera.updateProjectionMatrix();
  // Center the projected board, including the tall fixtures and the front edge.
  const projection = camera.projectionMatrix.elements;
  projection[8] = (left + right) / (2 * halfHeight * aspect);
  projection[9] = (bottom + top) / (2 * halfHeight);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  if (width !== renderWidth || height !== renderHeight) {
    renderer.setSize(width, height, false);
    renderWidth = width;
    renderHeight = height;
  }
}

const overheadButton = document.querySelector('#view-overhead');
const homeButton = document.querySelector('#view-home');

function updateView() {
  const angle = -viewTurns * Math.PI / 2;
  const delta = THREE.MathUtils.euclideanModulo(angle - tray.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  turnStart = tray.rotation.y;
  turnTarget = turnStart + delta;
  turnProgress = Math.abs(delta) < 0.001 ? 1 : 0;
  inspectingLid = false;
  aimCamera();
  resize();
  syncViewButtons();
}

function syncViewButtons() {
  overheadButton.setAttribute('aria-pressed', String(overhead));
  homeButton.disabled = viewTurns === 0 && !overhead && orbitYaw === 0
    && orbitTilt === 0 && viewZoom === 1 && !inspectingLid;
}

function resetOrbit() {
  orbitYaw = 0;
  orbitTilt = 0;
  viewZoom = 1;
}

document.querySelector('#view-left').addEventListener('click', () => {
  viewTurns = (viewTurns + 3) % 4;
  updateView();
});
document.querySelector('#view-right').addEventListener('click', () => {
  viewTurns = (viewTurns + 1) % 4;
  updateView();
});
overheadButton.addEventListener('click', () => {
  overhead = !overhead;
  updateView();
});
homeButton.addEventListener('click', () => {
  viewTurns = 0;
  overhead = false;
  resetOrbit();
  updateView();
});

const progressKey = 'steam-tycoon-progress-v1';

function readProgress() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(progressKey));
  } catch {
    // The game also works in a browser that blocks local storage.
  }
  const knownBoards = Object.fromEntries(levels.flatMap(({ name }) => {
    const entry = saved?.boards?.[name];
    if (!entry || !Array.isArray(entry.pipes)) return [];
    return [[name, {
      pipes: saved.boardSize === size ? entry.pipes : [],
      solved: entry.solved === true,
      rewardShown: entry.solved === true && entry.rewardShown === true,
    }]];
  }));
  return {
    boardSize: size,
    board: saved?.board,
    opened: saved?.opened === true || (saved?.opened === undefined &&
      levels.some(({ name, tutorial }) => !tutorial && name === saved?.board)),
    drawerDiscovered: saved?.drawerDiscovered === true,
    boards: knownBoards,
  };
}

const progress = readProgress();
const tutorialIndex = levels.findIndex(board => board.tutorial);
const scoredBoards = levels.length - 1;
let coverState = progress.opened ? 'open' : 'locked';
const levelSelect = document.querySelector('#level');
const ledgerCount = document.querySelector('#ledger-count');
const boardOptions = [...levelSelect.options].map(option => ({ option, label: option.textContent.trim() }));

function updateLedger() {
  let solved = 0;
  for (const { option, label } of boardOptions) {
    const complete = progress.boards[levels[Number(option.value)].name]?.solved;
    if (complete && !levels[Number(option.value)].tutorial) solved++;
    const title = complete ? `✓ ${label}` : label;
    if (option.textContent !== title) option.textContent = title;
  }
  const count = `${solved} / ${scoredBoards} solved`;
  if (ledgerCount.textContent !== count) ledgerCount.textContent = count;
}

function recordProgress() {
  progress.board = level.name;
  progress.drawerDiscovered = drawerDiscovered;
  const pipes = [...level.pipes].flatMap(([index, pipe]) =>
    pipe.fixed ? [] : [[index, pipe.type, pipe.rotation]]);
  progress.boards[level.name] = { pipes, solved: level.solved, rewardShown: level.rewardShown };
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } catch {
    // Keep the current route and ledger in memory if saving fails.
  }
  updateLedger();
}

function restoreBoard() {
  addPipe(level.source[0] + 1, level.source[1], 'straight', 0, true);
  for (const [x, z, type, rotation] of level.fixed ?? []) addPipe(x, z, type, rotation, true);
  const saved = progress.boards[level.name];
  if (!saved) return;
  level.solved = saved.solved;
  level.rewardShown = saved.rewardShown && [...milestones.keys()].some(i => levels[i].name === level.name);
  for (const entry of saved.pipes.slice(0, size * size)) {
    if (!Array.isArray(entry)) continue;
    const [index, type, rotation] = entry;
    if (!Number.isInteger(index) || index < 0 || index >= size * size ||
        typeof type !== 'string' || !canPlace(index, type) ||
        rackSlots.get(type)?.button.hidden ||
        !Number.isInteger(rotation) || rotation < 0 || rotation >= rotationCount[type] ||
        !editable(index % size, Math.floor(index / size))) continue;
    applyPipeState(index, { type, rotation });
  }
}

const heightControl = document.querySelector('#height-control');
const heightGuide = document.querySelector('#height-guide');
const guideGeometry = new THREE.BufferGeometry();
const guideLines = new THREE.LineSegments(guideGeometry,
  new THREE.LineBasicMaterial({ color: 0x90e7d1, transparent: true, opacity: 0.72, toneMapped: false }));
tray.add(guideLines);

function updateHeightGuide() {
  guideLines.visible = heightGuide.value !== '';
  if (!guideLines.visible) return;
  const points = [];
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const index = key(x, z);
      const height = heightAt(index);
      if (height !== Number(heightGuide.value) || level.blocked.has(index)) continue;
      const edge = 0.42;
      const y = height * heightStep + 0.018;
      const corners = [[-edge, -edge], [edge, -edge], [edge, edge], [-edge, edge]];
      for (let i = 0; i < 4; i++) {
        for (const [dx, dz] of [corners[i], corners[(i + 1) % 4]]) {
          points.push(world(x) + dx, y, world(z) + dz);
        }
      }
    }
  }
  guideGeometry.dispose();
  guideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  guideGeometry.computeBoundingSphere();
}

heightGuide.addEventListener('change', updateHeightGuide);

function clearSteamAndSelection() {
  selection = [level.source[0] + 1, Math.max(0, level.source[1] - 1)];
  highlight.visible = false;
  previewRotation = 0;
  touchPreview = null;
  hidePreview();
  snapMarkers.visible = false;
  snapTime = 0;
  buttons[0].click();
  nextWisp = 0.84;
  jetClock = ventClock = 0;
  boilerCycle = boilerPuffClock = 0;
  for (const { sprite } of particles) sprite.visible = false;
}

function selectLevel(index) {
  if (coverState !== 'open' && index !== tutorialIndex) {
    levelSelect.value = String(tutorialIndex);
    return;
  }
  stopCelebration();
  if (level) level.group.visible = false;
  powered = false;
  tray.rotation.y = 0;
  tray.updateMatrixWorld();
  const firstVisit = !boards[index];
  boards[index] ??= buildLevel(levels[index]);
  level = boards[index];
  level.group.visible = coverState === 'open';
  viewTurns = 0;
  overhead = false;
  resetOrbit();
  const advanced = level.machines.size > 1;
  const raised = level.heights.size > 0;
  const machineName = level.machineName ?? level.name;
  document.querySelector('#receiver-name').textContent = advanced ? 'Machines' : machineName;
  document.querySelector('#fixed-legend').hidden = !advanced && !raised;
  const goal = document.querySelector('#goal');
  if (level.tutorial) {
    goal.textContent = 'Pull out the pipe rack, pick up the elbow, and fit it into the gold-marked gap.';
  } else if (level.goal) {
    goal.textContent = level.goal;
  } else if (raised) {
    goal.textContent = advanced
      ? 'Feed both machines across three heights. Seal every branch.'
      : 'Place the riser on the lower tile. Turn its high end toward the raised deck.';
  } else {
    goal.textContent = advanced
      ? 'Power every machine and seal every open branch. Blue pipes are fixed.'
      : `Connect the boiler to the ${machineName.toLowerCase()}. Tap a placed pipe to turn it.`;
  }
  heightGuide.value = '';
  heightControl.hidden = !raised;
  heightGuide.querySelector('[value="2"]').disabled = ![...level.heights.values()].includes(2);
  updateHeightGuide();
  for (const button of buttons) {
    if (['tee', 'cross'].includes(button.dataset.tool)) {
      button.hidden = !level.junctions?.includes(button.dataset.tool);
    } else if (button.dataset.tool === 'riser') {
      button.hidden = !raised;
    } else if (button.dataset.tool === 'riser-elbow') {
      button.hidden = !level.bendRisers;
    }
  }
  for (const slot of rackSlots.values()) {
    slot.model.visible = !slot.button.hidden;
  }
  if (firstVisit) restoreBoard();
  prepareMilestone(index);
  updateView();
  clearSteamAndSelection();
  updateHistoryButtons();
  updateFlow(false);
}

levelSelect.addEventListener('change', () => selectLevel(Number(levelSelect.value)));
document.querySelector('#reset').addEventListener('click', () => {
  reset();
  clearSteamAndSelection();
});
drawerDiscovered = progress.drawerDiscovered;
if (drawerDiscovered) drawerLabel.textContent = 'Open pipe rack';
const savedIndex = levels.findIndex(({ name }) => name === progress.board);
levelSelect.value = String(progress.opened && savedIndex !== -1 ? savedIndex : tutorialIndex);
const lid = new THREE.Group();
lid.visible = coverState === 'open';
lid.position.set(0, 0.77, -4.31 - rimOffset);
lid.scale.x = 1.17;
lid.rotation.x = -0.66;
caseParts.add(lid);
castBlock(lid, frame, 7.48, 2.90, 0.19, 0, 0.40, -0.056, 0.056);
castBlock(lid, velvet, 7.23, 2.68, 0.07, 0, 0.40, 0.060, 0.021);
for (const y of [-0.949, 1.749]) {
  box(lid, inlay, 7.14, 0.016, 0.021, 0, y, 0.103);
}
for (const x of [-3.58, 3.58]) {
  box(lid, inlay, 0.017, 2.70, 0.022, x, 0.40, 0.103);
  for (const y of [-0.83, 1.63]) {
    const ornament = mesh(crestGeometry, brass, lid, x * 0.971, y, 0.109);
    ornament.rotation.z = Math.PI / 2 * Math.sign(x) * Math.sign(y);
    ornament.scale.setScalar(0.86);
  }
}
for (const x of [-2.60, 2.60]) {
  const hinge = cylinder(lid, bronze, 0.081, 0.38, x, -1.021, 0.026, 'x');
  hinge.castShadow = false;
  castBlock(caseParts, frame, 0.23, 0.87, 0.17, x * lid.scale.x, -0.43, -3.72 - rimOffset, 0.044);
}

function engraving(parent, width, height, x, y, z, options = {}) {
  const { color = '#f4d8a5', italic = false, fontScale = 0.68 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * 260);
  canvas.height = Math.round(height * 260);
  const pen = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ink = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), ink);
  label.position.set(x, y, z);
  parent.add(label);
  let cached;
  return function setText(text) {
    if (cached === text) return;
    cached = text;
    pen.clearRect(0, 0, canvas.width, canvas.height);
    pen.font = `${italic ? 'italic ' : ''}600 ${Math.round(canvas.height * fontScale)}px Georgia, serif`;
    pen.textAlign = 'center';
    pen.textBaseline = 'middle';
    pen.fillStyle = color;
    pen.fillText(text, canvas.width / 2, canvas.height * 0.53, canvas.width * 0.96);
    texture.needsUpdate = true;
  };
}

const coverHinge = new THREE.Group();
coverHinge.position.set(0, 0.10, -3.73 - rimOffset);
scene.add(coverHinge);
const leafLength = (boxWidth + 0.18) / 3;
const coverLeaves = [coverHinge, new THREE.Group(), new THREE.Group()];
for (let i = 1; i < coverLeaves.length; i++) {
  const parent = coverLeaves[i - 1];
  const leaf = coverLeaves[i];
  leaf.position.z = leafLength;
  parent.add(leaf);
}
for (const [i, leaf] of coverLeaves.entries()) {
  const middle = leafLength / 2;
  castBlock(leaf, frame, boxWidth + 0.21, 0.139, leafLength - 0.020, 0, 0, middle, 0.036);
  for (const x of [-4.16, 4.16]) {
    box(leaf, inlay, 0.020, 0.012, leafLength - 0.052, x, 0.073, middle);
  }
  for (const x of [-2.52, 2.52]) {
    const hinge = cylinder(leaf, bronze, 0.053, 0.36, x, 0.067, 0.027, 'x');
    hinge.castShadow = false;
  }
  if (i === 0 || i === 2) {
    const z = i === 0 ? 0.125 : leafLength - 0.125;
    box(leaf, inlay, boxWidth - 0.25, 0.012, 0.022, 0, 0.073, z);
    for (const x of [-4.07, 4.07]) {
      const corner = mesh(crestGeometry, inlay, leaf, x, 0.082, z);
      corner.rotation.x = -Math.PI / 2;
      corner.scale.setScalar(1.13);
    }
  }
}
const coverCartouche = new THREE.Group();
coverCartouche.position.set(0, 0.097, leafLength / 2);
coverCartouche.rotation.x = -Math.PI / 2;
coverLeaves[1].add(coverCartouche);
castBlock(coverCartouche, bronze, 3.15, 0.79, 0.035, 0, 0, 0.012, 0.013);
castBlock(coverCartouche, enamelBlue, 3.05, 0.69, 0.032, 0, 0, 0.035, 0.011);
mesh(crestGeometry, brass, coverCartouche, -1.20, 0, 0.056).scale.setScalar(1.25);
engraving(coverCartouche, 2.40, 0.48, 0.15, 0, 0.055, { italic: true })('Steam Tycoon');
const dedication = new THREE.Group();
dedication.position.set(0, -0.47, 0.015);
coverCartouche.add(dedication);
castBlock(dedication, bronze, 3.30, 0.37, 0.038, 0, 0, 0, 0.014);
castBlock(dedication, enamelBlue, 3.19, 0.29, 0.033, 0, 0, 0.022, 0.010);
engraving(dedication, 3.03, 0.227, 0, 0, 0.046, { italic: true })('For the keeper of the little engines');
dedication.scale.y = 0.01;
dedication.visible = false;
const ward = mesh(new THREE.TorusGeometry(0.144, 0.018, 8, 32), brass, coverCartouche, 1.26, 0, 0.063);
mesh(crestGeometry, brass, ward, 0, 0, 0.018).scale.setScalar(0.72);
const coverLock = new THREE.Group();
coverLock.position.set(0, 0.113, leafLength - 0.31);
coverLock.rotation.x = -Math.PI / 2;
coverLeaves[2].add(coverLock);
castBlock(coverLock, bronze, 1.92, 0.341, 0.063, 0.06, 0, 0, 0.025);
castBlock(coverLock, brass, 1.81, 0.284, 0.042, 0.06, 0, 0.039, 0.016);
const coverKnob = new THREE.Group();
coverKnob.position.set(-0.632, 0, 0.069);
coverLock.add(coverKnob);
cylinder(coverKnob, bronze, 0.112, 0.055, 0, 0, 0, 'z');
castBlock(coverKnob, brass, 0.156, 0.051, 0.032, 0, 0, 0.04, 0.014);
const coverHint = engraving(coverLock, 1.22, 0.202, 0.211, 0, 0.064, { color: '#2c2018' });
const coverBounds = boxCorners({
  min: new THREE.Vector3(-3.75 - rimOffset, -0.076, -0.020),
  max: new THREE.Vector3(3.75 + rimOffset, 0.28, leafLength + 0.025),
});
let claspTravel = 0;
let revealChimed = false;
let unfolding = coverState === 'open' ? 1 : 0;
const boardHelp = stage.getAttribute('aria-label');

function poseCover() {
  const rear = THREE.MathUtils.smoothstep(unfolding, 0, 0.94);
  const fold = THREE.MathUtils.smoothstep(unfolding, 0.13, 1);
  const tuck = THREE.MathUtils.smoothstep(unfolding, 0.69, 1);
  coverHinge.position.set(0, 0.10 - 0.36 * tuck, -3.73 - rimOffset - 0.79 * tuck);
  coverLeaves[0].rotation.x = -2.69 * rear;
  coverLeaves[1].rotation.x = 3.01 * fold;
  coverLeaves[2].rotation.x = -3.03 * fold;
  const released = THREE.MathUtils.smoothstep(claspTravel, 0, 1);
  coverKnob.rotation.z = released * Math.PI / 2;
  ward.rotation.z = released * Math.PI;
  dedication.visible = released > 0.36;
  dedication.scale.y = Math.max(0.01, THREE.MathUtils.smoothstep(released, 0.36, 1));
  dedication.position.y = -0.31 - released * 0.23;
}

function updateOpeningHint() {
  const locked = coverState === 'locked';
  coverHint(locked ? 'Turn the seal' : 'Lift the lid');
  openBoxButton.textContent = locked ? 'Turn the seal' : 'Lift the lid';
  openBoxButton.disabled = coverState === 'opening';
  openBoxButton.hidden = coverState === 'open';
  stage.setAttribute('aria-label', coverState === 'open' ? boardHelp
    : locked ? 'A sealed gift box. Turn the brass seal or press Enter.'
      : 'For the keeper of the little engines. Click the lid or press Enter to lift it.');
}

function advanceCover() {
  if (coverState === 'locked') {
    coverState = 'unlatched';
    playSound('latch');
    poseCover();
  } else if (coverState === 'unlatched') {
    coverState = 'opening';
    playSound('latch');
  }
  updateOpeningHint();
}

openBoxButton.addEventListener('click', advanceCover);
poseCover();
updateOpeningHint();

function animateCover(elapsed) {
  if ((coverState === 'unlatched' || coverState === 'opening') && claspTravel < 1) {
    claspTravel = Math.min(1, claspTravel + elapsed * 2.2);
    poseCover();
    if (claspTravel === 1 && coverState === 'unlatched') playSound('chime');
  }
  if (coverState !== 'opening') return;
  unfolding = Math.min(1, unfolding + elapsed * 0.69);
  poseCover();
  if (unfolding >= 0.53 && !revealChimed) {
    revealChimed = true;
    playSound('chime');
  }
  if (unfolding >= 0.65) level.group.visible = true;
  if (unfolding >= 0.82) lid.visible = true;
  if (unfolding === 1) {
    coverState = 'open';
    progress.opened = true;
    recordProgress();
    updateOpeningHint();
  }
  resize();
}

const tutorialMarker = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    [-0.39, -0.39], [0.39, -0.39], [0.39, 0.39], [-0.39, 0.39],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z))),
  new THREE.LineBasicMaterial({ color: 0xf2b952, toneMapped: false }),
);
const [gapX, gapZ] = levels[tutorialIndex].tutorialGap;
tutorialMarker.position.set(world(gapX), 0.018, world(gapZ));
const tutorialWash = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({
  color: 0xecac50, transparent: true, opacity: 0.23, depthWrite: false, toneMapped: false,
}));
tutorialWash.rotation.x = -Math.PI / 2;
tutorialWash.position.y = -0.008;
tutorialMarker.add(tutorialWash);
tutorialMarker.visible = false;
tray.add(tutorialMarker);

const titleHeight = 1.29;
const titleStamp = engraving(lid, 3.7, 0.50, 0, titleHeight, 0.170, { italic: true, fontScale: 0.83 });
titleStamp('Steam Tycoon');
const inHandStamp = engraving(lid, 1.85, 0.20, -2.33, 0.23, 0.127);
const ivoryPlate = material(0xdab684, 0.22, 0.48);
castBlock(lid, bronze, 2.91, 0.415, 0.061, 0, 0.63, 0.116, 0.019);
castBlock(lid, ivoryPlate, 2.81, 0.338, 0.041, 0, 0.63, 0.148, 0.015);
const boardStamp = engraving(lid, 2.70, 0.235, 0, 0.63, 0.172, { color: '#2c1a16' });
const statusStamp = engraving(lid, 6.15, 0.237, 0, -0.085, 0.128);
const ledgerStamp = engraving(lid, 2.60, 0.194, 0, 0.255, 0.116);
const dial = new THREE.Group();
dial.position.set(2.76, 0.66, 0.106);
lid.add(dial);
cylinder(dial, bronze, 0.322, 0.071, 0, 0, 0, 'z');
mesh(new THREE.CircleGeometry(0.287, 44), gaugeFace, dial, 0, 0, 0.042);
mesh(new THREE.TorusGeometry(0.302, 0.018, 10, 42), brass, dial, 0, 0, 0.046);
const lidNeedle = new THREE.Group();
lidNeedle.scale.setScalar(0.77);
dial.add(lidNeedle);
box(lidNeedle, gaugeRed, 0.039, 0.335, 0.012, 0, 0.121, 0.068);
cylinder(dial, brass, 0.036, 0.025, 0, 0, 0.063, 'z');
const pressureStamp = engraving(lid, 1.25, 0.195, 2.76, 0.232, 0.12);
const ledgerMark = mesh(rivetGeometry, collarActive, lid, -3.23, -0.085, 0.136);
ledgerMark.scale.setScalar(0.80);
for (const x of [-2.26, 0, 2.26]) {
  box(lid, inlay, x === 0 ? 1.75 : 1.92, 0.009, 0.012, x, -0.245, 0.105);
}

const keyFinish = material(0xe8cf9e, 0.14, 0.47);
const keyHover = material(0xffe8b6, 0.20, 0.40);
const keyPressed = material(0xd09a53, 0.30, 0.39);
const keyDisabled = material(0x8e7d69, 0.14, 0.63);
const keyRim = material(0xe5af5c, 0.73, 0.32);
const keySettings = new Map();
const lidControls = [];
let hoveredControl = null;

function cartoucheFace(width, height, depth) {
  const dimensions = [width, height, depth].join(',');
  if (keySettings.has(dimensions)) return keySettings.get(dimensions);
  const x = width / 2;
  const y = height / 2;
  const shoulder = Math.min(0.104, width * 0.19);
  const outline = new THREE.Shape();
  outline.moveTo(-x, 0);
  outline.bezierCurveTo(-x, y * 0.68, -x + shoulder * 0.7, y * 0.63, -x + shoulder, y);
  outline.lineTo(x - shoulder, y);
  outline.bezierCurveTo(x - shoulder * 0.7, y * 0.63, x, y * 0.68, x, 0);
  outline.bezierCurveTo(x, -y * 0.68, x - shoulder * 0.7, -y * 0.63, x - shoulder, -y);
  outline.lineTo(-x + shoulder, -y);
  outline.bezierCurveTo(-x + shoulder * 0.7, -y * 0.63, -x, -y * 0.68, -x, 0);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth, bevelThickness: 0.008, bevelSize: 0.010, bevelSegments: 2, curveSegments: 5,
  });
  keySettings.set(dimensions, geometry);
  return geometry;
}

// Layered gilt molding and mirrored scrollwork around the enamel title plaque.
mesh(cartoucheFace(4.34, 0.65, 0.016), bronze, lid, 0, titleHeight, 0.107);
mesh(cartoucheFace(4.26, 0.60, 0.013), keyRim, lid, 0, titleHeight, 0.125);
mesh(cartoucheFace(4.16, 0.52, 0.013), enamelBlue, lid, 0, titleHeight, 0.142);
for (const side of [-1, 1]) {
  const ornament = new THREE.Group();
  ornament.position.set(side * 2.04, titleHeight, 0.125);
  ornament.scale.x = side;
  lid.add(ornament);
  const scroll = new THREE.CurvePath();
  const point = (x, y) => new THREE.Vector3(x, y, 0);
  scroll.add(new THREE.CubicBezierCurve3(point(0, 0.09), point(0.36, 0.47), point(0.35, -0.37), point(0.80, -0.16)));
  scroll.add(new THREE.CubicBezierCurve3(point(0.80, -0.16), point(1.12, -0.01), point(0.83, 0.31), point(0.70, 0.12)));
  scroll.add(new THREE.CubicBezierCurve3(point(0.70, 0.12), point(0.62, 0.01), point(0.75, -0.045), point(0.78, 0.044)));
  mesh(new THREE.TubeGeometry(scroll, 48, 0.018, 8), keyRim, ornament);
  const leaf = mesh(crestGeometry, keyRim, ornament, 0.38, 0.16, 0);
  leaf.rotation.z = -0.72;
  leaf.scale.setScalar(0.69);
}
const crown = mesh(crestGeometry, keyRim, lid, 0, 1.65, 0.161);
crown.scale.setScalar(1.05);

function castKey(x, y, width, label, invoke, disabled = () => false, pressed = () => false, height = 0.323) {
  const group = new THREE.Group();
  group.position.set(x, y, 0.122);
  lid.add(group);
  mesh(cartoucheFace(width + 0.046, height + 0.046, 0.016), bronze, group);
  mesh(cartoucheFace(width + 0.023, height + 0.022, 0.015), keyRim, group, 0, 0, 0.020);
  mesh(cartoucheFace(width - 0.028, height - 0.020, 0.010), enamelBlue, group, 0, 0, 0.036);
  const keyTop = mesh(cartoucheFace(width - 0.058, height - 0.042, 0.012), keyFinish, group, 0, 0, 0.044);
  if (width > 0.60) {
    for (const side of [-1, 1]) {
      const flourish = mesh(crestGeometry, bronze, group, side * (width / 2 - 0.108), 0, 0.064);
      flourish.rotation.z = side * Math.PI / 2;
      flourish.scale.setScalar(0.32);
    }
  }
  const write = engraving(group, width - (width > 0.60 ? 0.26 : 0.095), 0.199, 0, 0.005, 0.072,
    { color: '#382317', italic: true, fontScale: 0.84 });
  const control = { keyTop, write, label, invoke, disabled, pressed };
  group.userData.control = control;
  lidControls.push(control);
}

function moveBoard(amount) {
  const next = levelSelect.selectedIndex + amount;
  if (next < 0 || next >= levelSelect.options.length) return;
  levelSelect.selectedIndex = next;
  levelSelect.dispatchEvent(new Event('change'));
}

function toggleLidInspection() {
  inspectingLid = !inspectingLid;
  syncViewButtons();
  hoveredControl = null;
  stage.focus({ preventScroll: true });
  highlight.visible = false;
  hidePreview();
  aimCamera();
  resize();
}
castKey(-2.76, 0.63, 1.12, () => inspectingLid ? 'Return' : 'Inspect lid', toggleLidInspection);
castKey(-1.77, 0.63, 0.40, () => '‹', () => moveBoard(-1), () => levelSelect.selectedIndex === 0);
castKey(1.77, 0.63, 0.40, () => '›', () => moveBoard(1), () => levelSelect.selectedIndex === levelSelect.options.length - 1);

function cycleHeight() {
  const allowed = [...heightGuide.options].filter(option => !option.disabled);
  const index = allowed.findIndex(option => option.selected);
  heightGuide.value = allowed[(index + 1) % allowed.length].value;
  heightGuide.dispatchEvent(new Event('change'));
}

const keyActions = [
  ['Rack', drawerLatch, () => drawerOpen],
  ['Turn', turnPiece],
  ['Undo', undoButton],
  ['Redo', redoButton],
  ['Left', document.querySelector('#view-left')],
  ['Right', document.querySelector('#view-right')],
  ['Height', heightGuide, () => heightGuide.value !== '', cycleHeight, () => heightControl.hidden],
  ['Fitting', rewardLatch, () => rewardOpen, null, () => rewardPlate.hidden],
  ['Reset', document.querySelector('#reset')],
  ['Sound', soundButton, () => !muted],
  ['Top', overheadButton, () => overhead],
  ['Home', homeButton],
];

const keyColumns = [-2.79, -1.73, -0.53, 0.53, 1.73, 2.79];
for (const [i, [label, button, pressed, invoke, disabled]] of keyActions.entries()) {
  castKey(keyColumns[i % 6], i < 6 ? -0.445 : -0.790, 0.92,
    label === 'Height' ? () => heightGuide.value ? `Level ${heightGuide.value}` : 'Height' : () => label,
    invoke ?? (() => button.click()), disabled ?? (() => button.disabled), pressed, 0.233);
}

const lidBounds = boxCorners(new THREE.Box3().setFromObject(lid));

function updateCaseLid() {
  const number = Number(levelSelect.value) + 1;
  const boardTitle = level.tutorial ? level.name : `${number} · ${level.name}`;
  boardStamp(`${powered ? '✓ ' : ''}${boardTitle}`);
  ledgerStamp(ledgerCount.textContent);
  pressureStamp(`Pressure ${pressureReadout.textContent}`);
  inHandStamp(drawerDiscovered ? `In hand · ${selectedTool.textContent}` : 'Release the pipe rack');
  let readout = powered && rewardOpen ? rewardLabel.textContent : status.textContent;
  if (level.tutorial) {
    if (powered) readout = 'First fitting complete · Next board ›';
    else if (!drawerOpen && tool !== 'elbow') readout = 'Pull the brass ring to open the rack';
    else if (tool !== 'elbow') readout = 'Pick up the elbow from the rack';
    else readout = 'Fit it into the gold-marked gap';
  }
  tutorialMarker.visible = coverState === 'open' && level.tutorial && !level.pipes.has(key(gapX, gapZ));
  statusStamp(readout);
  ledgerMark.material = powered ? collarActive : bronze;
  for (const control of lidControls) {
    const { keyTop, label, write, disabled, pressed } = control;
    write(label());
    keyTop.material = disabled() ? keyDisabled
      : hoveredControl === control ? keyHover
      : pressed() ? keyPressed : keyFinish;
  }
}

selectLevel(Number(levelSelect.value));
new ResizeObserver(resize).observe(stage);
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const elapsed = Math.max(0, (now - previous) / 1000);
  const dt = Math.min(elapsed, 0.05);
  previous = now;
  turnTray(Math.min(elapsed, 0.26));
  moveDrawer(Math.min(elapsed, 0.26));
  animateReward(Math.min(elapsed, 0.26));
  animateCelebration(Math.min(elapsed, 0.26));
  animateCover(Math.min(elapsed, 0.26));
  animateMachine(dt, elapsed);
  animateSnap(dt);
  animateGauge(elapsed);
  updateCaseLid();
  if (coverState === 'open') animateSteam(dt, elapsed);
  renderer.render(scene, camera);
});

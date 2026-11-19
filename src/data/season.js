// BIOGLOW Founders Edition robot game data, taken from the 2026 Robot Game Rulebook
// and the official classpack and software scoresheets.

export const PRECISION_POINTS = [0, 10, 15, 25, 35, 50, 50] // index = tokens remaining
export const EQUIPMENT_POINTS = 20

export const GP_LEVELS = [
  { v: 2, label: 'Developing' },
  { v: 3, label: 'Accomplished' },
  { v: 4, label: 'Exceeds' },
]

const yes = (key, label, bonus = false) => ({ key, label, kind: 'yes', bonus })
const count = (key, label, max, bonus = false) => ({ key, label, kind: 'count', max, bonus })
const choice = (key, label, options) => ({ key, label, kind: 'choice', options })

export const MISSIONS = [
  {
    id: 'M01', n: 1, name: 'Drone Survey', bags: '1, 2', noEquip: true, max: 30,
    blurb: 'Launch the drone and make a LiDAR map of the canopy.',
    fields: [
      yes('drone', 'Drone is no longer touching the mat'),
      yes('lidar', 'Bonus: LiDAR map completely flipped over, scan marker at least partly in survey area', true),
    ],
    score: (v) => (v.drone ? 20 : 0) + (v.drone && v.lidar ? 10 : 0),
  },
  {
    id: 'M02', n: 2, name: 'Exploding Seeds', bags: '3', max: 30,
    blurb: 'Pop the seeds off the stalk, 10 points each.',
    fields: [count('seeds', 'Seeds no longer touching the stalk', 3)],
    score: (v) => (v.seeds ?? 0) * 10,
  },
  {
    id: 'M03', n: 3, name: 'Flip the Rock', bags: '4, 5', max: 30,
    blurb: 'Flip the rock, then put it back the way you found it.',
    fields: [
      yes('flag', 'The research flag is down'),
      yes('rock', 'Bonus: rock returned to its original starting position', true),
    ],
    score: (v) => (v.flag ? 20 : 0) + (v.flag && v.rock ? 10 : 0),
  },
  {
    id: 'M04', n: 4, name: 'Lucky Leaves', bags: '6', noEquip: true, max: 30,
    blurb: 'Pull leaves off the nest without scaring off the katydid.',
    note: 'If the katydid is completely outside the leaf habitat at the end, the mission scores 0.',
    fields: [
      count('leaves', 'Leaves no longer touching the nest', 2),
      yes('habitat', 'Katydid is at least partly in the leaf habitat'),
      yes('katydid', 'Bonus: second leaf removed and katydid in original position', true),
    ],
    score: (v) => {
      if (!v.habitat) return 0
      return (v.leaves >= 1 ? 10 : 0) + (v.leaves >= 2 && v.katydid ? 20 : 0)
    },
  },
  {
    id: 'M05', n: 5, name: 'Reaching Roots', bags: '7', noEquip: true, max: 20,
    blurb: 'Stretch the plant root out past the forest boundary.',
    note: 'Only one scoring condition is possible.',
    fields: [
      choice('root', 'Plant root is', [
        { v: 'none', label: 'No' },
        { v: 'partial', label: 'Partially · 10' },
        { v: 'complete', label: 'Completely · 20' },
      ]),
    ],
    score: (v) => (v.root === 'complete' ? 20 : v.root === 'partial' ? 10 : 0),
  },
  {
    id: 'M06', n: 6, name: 'Leafcutter Frenzy', bags: '8, 9, 10', max: 40,
    blurb: 'Guide the ant back to the nest with its leaf fragments.',
    fields: [
      yes('ant', 'The ant is touching the nest'),
      count('fragments', 'Leaf fragments contained within the nest', 4),
    ],
    score: (v) => (v.ant ? (v.fragments ?? 0) * 10 : 0),
  },
  {
    id: 'M07', n: 7, name: 'Humongous Fungus', bags: '10', noEquip: true, max: 40,
    blurb: 'Grow the mycelium and connect it to a tree root.',
    note: 'Bonus is not possible in remote competitions or with no opposing team.',
    fields: [
      yes('myc', 'The mycelium is completely extended'),
      count('connections', 'Bonus: connections to the opposing team’s fully extended plant root', 2, true),
    ],
    score: (v) => (v.myc ? 20 + (v.connections ?? 0) * 10 : 0),
  },
  {
    id: 'M08', n: 8, name: 'Tangled', bags: '11–15', max: 30,
    blurb: 'Untangle the vines so the tree has room to grow.',
    fields: [yes('vine', 'The vine is touching the mat')],
    score: (v) => (v.vine ? 30 : 0),
  },
  {
    id: 'M09', n: 9, name: 'Research Platform', bags: '11–15', noEquip: true, max: 30,
    blurb: 'Raise the platform, deploy the camera trap, move the seed.',
    fields: [
      yes('platform', 'The research platform is raised'),
      yes('camera', 'The camera trap is deployed'),
      yes('seed', 'The seed is no longer touching the tree'),
    ],
    score: (v) => (v.platform ? 10 : 0) + (v.camera ? 10 : 0) + (v.seed ? 10 : 0),
  },
  {
    id: 'M10', n: 10, name: 'Fragile Microhabitats', bags: '16', noEquip: true, max: 20,
    blurb: 'Move past the spider and snail habitats without wrecking them.',
    fields: [
      yes('spider', 'Spider habitat is in its original starting position'),
      yes('snail', 'Snail habitat is in its original starting position'),
    ],
    score: (v) => (v.spider ? 10 : 0) + (v.snail ? 10 : 0),
  },
  {
    id: 'M11', n: 11, name: 'Window to the Past', bags: '17', max: 20,
    blurb: 'Open the root cover and let the window show the history.',
    fields: [yes('root', 'The root cover is down, touching the mat')],
    score: (v) => (v.root ? 20 : 0),
  },
  {
    id: 'M12', n: 12, name: 'Forest Elder', bags: '18', noEquip: true, max: 30,
    blurb: 'Raise the cane to support the old tree and tie it to the post.',
    fields: [
      yes('cane', 'The cane is completely raised, touching the tree'),
      yes('tie', 'The support tie is around the post'),
    ],
    score: (v) => (v.cane ? 20 : 0) + (v.tie ? 10 : 0),
  },
  {
    id: 'M13', n: 13, name: 'Keystone Species', bags: '19, 20', max: 30,
    blurb: 'Deliver your keystone species to the restoration platform. Uses the dock system.',
    fields: [yes('keystone', 'Keystone species is on the restoration platform and the young trees are raised')],
    score: (v) => (v.keystone ? 30 : 0),
  },
  {
    id: 'M14', n: 14, name: 'Seeds of Renewal', bags: '21', max: 40,
    blurb: 'Put seeds in the replantation station, then get them touching the mat.',
    fields: [
      count('seeds', 'Seeds contained within the replantation station', 4),
      count('touching', 'Bonus: seeds touching the mat', 4, true),
    ],
    score: (v) => {
      const s = v.seeds ?? 0
      return s * 5 + Math.min(v.touching ?? 0, s) * 5
    },
  },
  {
    id: 'M15', n: 15, name: 'Biocentric Architecture', bags: '22, 23, 24', noEquip: true, max: 40,
    blurb: 'Modify the building for wildlife, soil, and light. Uses the dock system.',
    note: 'Environmental bonus: Mine dock needs the nesting canopy, City dock the garden skylight, Farm dock the compost hatch.',
    fields: [
      yes('canopy', 'The nesting canopy is raised'),
      yes('skylight', 'The garden skylight is completely in'),
      yes('hatch', 'The compost hatch is completely opened, touching the mat'),
      choice('dock', 'Dock location', [
        { v: 'mine', label: 'Mine' },
        { v: 'city', label: 'City' },
        { v: 'farm', label: 'Farm' },
      ]),
    ],
    score: (v) => {
      const base = (v.canopy ? 10 : 0) + (v.skylight ? 10 : 0) + (v.hatch ? 10 : 0)
      const env =
        (v.dock === 'mine' && v.canopy) ||
        (v.dock === 'city' && v.skylight) ||
        (v.dock === 'farm' && v.hatch)
      return base + (env ? 10 : 0)
    },
  },
]

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]))

/** Explanations derived from the existing case-study requirements and screens. */
export const walkthroughs: Record<string, string[]> = {
  'dashboard-screens': [
    'Start with the order and quality overview. The dashboard brings the records used by the workshop into one place.',
    'Open the design specification: 15 fields stay attached to the order, with revisions tracked before production uses them.',
    'Follow the order through production. The current stage shows where the work is being held.',
    'At each gate, the operator completes the stage checklist before the batch moves forward.',
    'A failed check becomes a non-conformance record. The failure remains attached to the work that needs correction.',
    'Return to the current procedure. Version history helps prevent an old printed SOP from becoming the working instruction.',
  ],
  'delivered-screens': [
    'The overview gathers production and warehouse totals, replacing separate views of the same operation in the proposed system.',
    'Production Planning owns the master schedule. Warehouse staff and operators read the plan through their respective access roles.',
    'Daily targets connect the schedule to recorded progress, making the planned work and its execution readable together.',
    'Warehouse staff own component stock. Operators can see that stock without permission to change it.',
    'Finished assemblies complete the record. The design connects output to the plan; live factory performance was not measured.',
  ],
  'prototype-views': [
    'The assembled detector brings the display, buzzer and reset button into a unit that can be used at the sewing station.',
    'The adjustable holder fixes distance and angle as one mounting position, facing the reflective mark on the bobbin.',
    'The bench rig controls the test. Between replications the sensor is removed and mounted again, so mounting variation remains part of the measurement.',
  ],
  'site-sections': [
    'The course template divides information, resources, software and submissions into four tabs inside one stable frame.',
    'The team template repeats one assistant card across five divisions, so changing group sizes do not require a new layout.',
    'The About page combines the laboratory profile, vision, mission and work programme in one readable hierarchy.',
    'The activity archive turns visits, competitions and research into a repeatable post collection instead of one-off pages.',
    'The long-form template gives profiles and articles a quieter reading layout without leaving the wider site system.',
  ],
  'recruitment-series': [
    'The teaser uses a silhouette and date to create recognition before the application details appear.',
    'The requirements frame gives the QR code and application information the centre while the repeated brand zones stay fixed.',
    'The extension changes the deadline without changing the campaign language, so the update is recognized as part of the same sequence.',
  ],
  'internship-stories': [
    'The cover introduces the contributor, company and story before the carousel asks for any reading.',
    'The second frame keeps company and project context in the same text structure used across contributors.',
    'The final story frame changes the content while preserving the reading position and visual rhythm.',
  ],
  'team-series': [
    'The organization cover establishes the full group before the sequence moves into smaller teams.',
    'The core-team cover keeps the same portrait and title logic at a smaller group size.',
    'The Public Affair cover applies the same system to the division responsible for the content itself.',
    'The roster recap repeats one member card across the organization, proving the layout can absorb very different team sizes.',
  ],
  'event-recap': [
    'The opening contact sheet treats the event as a collection rather than forcing one photograph to carry the story.',
    'A fixed grid absorbs photographs with different lighting, crops and levels of visual quality.',
    'The third frame keeps the same rhythm while introducing more people and activity.',
    'The closing frame completes the recap without inventing a new visual rule for the final slide.',
  ],
}

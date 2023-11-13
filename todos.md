

## Part 1
Load an LDtk project file into excalibur

Load phase
* Point at a *.ldtk file (excalibur resource)
* Load/specify a level interested
* Locate the tileset images and load those

Parse phase
* Iterate through the current level
  - Build excalibur TileMaps using the appropriate level.ldtkl

## Part 2

* Parse entities
  - [x] Create a default actor (named with the identifyer)
  - [x] Position with the pixel position 
  - [ ] Add some smarts to parse tags to inform excalibur about actor option
* [x]  Move entities
* Parse integer layers
  - [x] Add colliders
* New Level?


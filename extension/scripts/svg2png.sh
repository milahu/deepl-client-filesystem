#!/usr/bin/env bash

# requires imagemagick

set -e # exit when any command fails
set -o xtrace # print commands

for i in src/images/*.svg
do
	for size in 24 48
	do
		o="$i.$size.png"
		convert -size ${size}x -background none "$i" "$o"
	done
done

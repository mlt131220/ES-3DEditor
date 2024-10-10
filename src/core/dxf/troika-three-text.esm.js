import { Color, DataTexture, LuminanceFormat, LinearFilter, Vector3, InstancedBufferGeometry, Sphere, Box3, InstancedBufferAttribute, PlaneGeometry as PlaneBufferGeometry, Vector2, Vector4, Matrix3, MeshBasicMaterial, DoubleSide, Matrix4, Mesh } from 'three';
import { defineWorkerModule, ThenableWorkerModule } from './troika-worker-utils.esm.js';
import { createDerivedMaterial, voidMainRegExp } from './troika-three-utils.esm.js';

/**
 * Initializes and returns a function to generate an SDF texture for a given glyph.
 * @param {function} createGlyphSegmentsQuadtree - factory for a GlyphSegmentsQuadtree implementation.
 * @param {number} config.sdfDistancePercent - see docs for SDF_DISTANCE_PERCENT in TextBuilder.js
 *
 * @return {function(Object): {renderingBounds: [minX, minY, maxX, maxY], textureData: Uint8Array}}
 */
function createSDFGenerator(createGlyphSegmentsQuadtree, config) {
  const {
    sdfDistancePercent
  } = config;

  /**
   * How many straight line segments to use when approximating a glyph's quadratic/cubic bezier curves.
   */
  const CURVE_POINTS = 16;

  /**
   * Find the point on a quadratic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnQuadraticBezier(x0, y0, x1, y1, x2, y2, t) {
    const t2 = 1 - t;
    return {
      x: t2 * t2 * x0 + 2 * t2 * t * x1 + t * t * x2,
      y: t2 * t2 * y0 + 2 * t2 * t * y1 + t * t * y2
    }
  }

  /**
   * Find the point on a cubic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, t) {
    const t2 = 1 - t;
    return {
      x: t2 * t2 * t2 * x0 + 3 * t2 * t2 * t * x1 + 3 * t2 * t * t * x2 + t * t * t * x3,
      y: t2 * t2 * t2 * y0 + 3 * t2 * t2 * t * y1 + 3 * t2 * t * t * y2 + t * t * t * y3
    }
  }

  /**
   * Generate an SDF texture segment for a single glyph.
   * @param {object} glyphObj
   * @param {number} sdfSize - the length of one side of the SDF image.
   *        Larger images encode more details. Must be a power of 2.
   * @return {{textureData: Uint8Array, renderingBounds: *[]}}
   */
  function generateSDF(glyphObj, sdfSize) {
    //console.time('glyphSDF')

    const textureData = new Uint8Array(sdfSize * sdfSize);

    // Determine mapping between glyph grid coords and sdf grid coords
    const glyphW = glyphObj.xMax - glyphObj.xMin;
    const glyphH = glyphObj.yMax - glyphObj.yMin;

    // Choose a maximum distance radius in font units, based on the glyph's max dimensions
    const fontUnitsMaxDist = Math.max(glyphW, glyphH) * sdfDistancePercent;

    // Use that, extending to the texture edges, to find conversion ratios between texture units and font units
    const fontUnitsPerXTexel = (glyphW + fontUnitsMaxDist * 2) / sdfSize;
    const fontUnitsPerYTexel = (glyphH + fontUnitsMaxDist * 2) / sdfSize;

    const textureMinFontX = glyphObj.xMin - fontUnitsMaxDist - fontUnitsPerXTexel;
    const textureMinFontY = glyphObj.yMin - fontUnitsMaxDist - fontUnitsPerYTexel;
    const textureMaxFontX = glyphObj.xMax + fontUnitsMaxDist + fontUnitsPerXTexel;
    const textureMaxFontY = glyphObj.yMax + fontUnitsMaxDist + fontUnitsPerYTexel;

    function textureXToFontX(x) {
      return textureMinFontX + (textureMaxFontX - textureMinFontX) * x / sdfSize
    }

    function textureYToFontY(y) {
      return textureMinFontY + (textureMaxFontY - textureMinFontY) * y / sdfSize
    }

    if (glyphObj.pathCommandCount) { //whitespace chars will have no commands, so we can skip all this
      // Decompose all paths into straight line segments and add them to a quadtree
      const lineSegmentsIndex = createGlyphSegmentsQuadtree(glyphObj);
      let firstX, firstY, prevX, prevY;
      glyphObj.forEachPathCommand((type, x0, y0, x1, y1, x2, y2) => {
        switch (type) {
          case 'M':
            prevX = firstX = x0;
            prevY = firstY = y0;
            break
          case 'L':
            if (x0 !== prevX || y0 !== prevY) { //yup, some fonts have zero-length line commands
              lineSegmentsIndex.addLineSegment(prevX, prevY, (prevX = x0), (prevY = y0));
            }
            break
          case 'Q': {
            let prevPoint = {x: prevX, y: prevY};
            for (let i = 1; i < CURVE_POINTS; i++) {
              let nextPoint = pointOnQuadraticBezier(
                prevX, prevY,
                x0, y0,
                x1, y1,
                i / (CURVE_POINTS - 1)
              );
              lineSegmentsIndex.addLineSegment(prevPoint.x, prevPoint.y, nextPoint.x, nextPoint.y);
              prevPoint = nextPoint;
            }
            prevX = x1;
            prevY = y1;
            break
          }
          case 'C': {
            let prevPoint = {x: prevX, y: prevY};
            for (let i = 1; i < CURVE_POINTS; i++) {
              let nextPoint = pointOnCubicBezier(
                prevX, prevY,
                x0, y0,
                x1, y1,
                x2, y2,
                i / (CURVE_POINTS - 1)
              );
              lineSegmentsIndex.addLineSegment(prevPoint.x, prevPoint.y, nextPoint.x, nextPoint.y);
              prevPoint = nextPoint;
            }
            prevX = x2;
            prevY = y2;
            break
          }
          case 'Z':
            if (prevX !== firstX || prevY !== firstY) {
              lineSegmentsIndex.addLineSegment(prevX, prevY, firstX, firstY);
            }
            break
        }
      });

      // For each target SDF texel, find the distance from its center to its nearest line segment,
      // map that distance to an alpha value, and write that alpha to the texel
      for (let sdfX = 0; sdfX < sdfSize; sdfX++) {
        for (let sdfY = 0; sdfY < sdfSize; sdfY++) {
          const signedDist = lineSegmentsIndex.findNearestSignedDistance(
            textureXToFontX(sdfX + 0.5),
            textureYToFontY(sdfY + 0.5),
            fontUnitsMaxDist
          );
          //if (!isFinite(signedDist)) throw 'infinite distance!'
          let alpha = isFinite(signedDist) ? Math.round(255 * (1 + signedDist / fontUnitsMaxDist) * 0.5) : signedDist;
          alpha = Math.max(0, Math.min(255, alpha)); //clamp
          textureData[sdfY * sdfSize + sdfX] = alpha;
        }
      }
    }

    //console.timeEnd('glyphSDF')

    return {
      textureData: textureData,

      renderingBounds: [
        textureMinFontX,
        textureMinFontY,
        textureMaxFontX,
        textureMaxFontY
      ]
    }
  }


  return generateSDF
}

/**
 * Creates a self-contained environment for processing text rendering requests.
 *
 * It is important that this function has no closure dependencies, so that it can be easily injected
 * into the source for a Worker without requiring a build step or complex dependency loading. All its
 * dependencies must be passed in at initialization.
 *
 * @param {function} fontParser - a function that accepts an ArrayBuffer of the font data and returns
 * a standardized structure giving access to the font and its glyphs:
 *   {
 *     unitsPerEm: number,
 *     ascender: number,
 *     descender: number,
 *     forEachGlyph(string, fontSize, letterSpacing, callback) {
 *       //invokes callback for each glyph to render, passing it an object:
 *       callback({
 *         index: number,
 *         advanceWidth: number,
 *         xMin: number,
 *         yMin: number,
 *         xMax: number,
 *         yMax: number,
 *         pathCommandCount: number,
 *         forEachPathCommand(callback) {
 *           //invokes callback for each path command, with args:
 *           callback(
 *             type: 'M|L|C|Q|Z',
 *             ...args //0 to 6 args depending on the type
 *           )
 *         }
 *       })
 *     }
 *   }
 * @param {function} sdfGenerator - a function that accepts a glyph object and generates an SDF texture
 * from it.
 * @param {Object} config
 * @return {Object}
 */
function createFontProcessor(fontParser, sdfGenerator, config) {

  const {
    defaultFontUrl
  } = config;


  /**
   * @private
   * Holds data about font glyphs and how they relate to SDF atlases
   *
   * {
   *   'fontUrl@sdfSize': {
   *     fontObj: {}, //result of the fontParser
   *     glyphs: {
   *       [glyphIndex]: {
   *         atlasIndex: 0,
   *         glyphObj: {}, //glyph object from the fontParser
   *         renderingBounds: [x0, y0, x1, y1]
   *       },
   *       ...
   *     },
   *     glyphCount: 123
   *   }
   * }
   */
  const fontAtlases = Object.create(null);

  /**
   * Holds parsed font objects by url
   */
  const fonts = Object.create(null);

  const INF = Infinity;


  /**
   * Load a given font url
   */
  function doLoadFont(url, callback) {
    function tryLoad() {
      const onError = err => {
        console.error(`Failure loading font ${url}${url === defaultFontUrl ? '' : '; trying fallback'}`, err);
        if (url !== defaultFontUrl) {
          url = defaultFontUrl;
          tryLoad();
        }
      };
      try {
        const request = new XMLHttpRequest();
        request.open('get', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
          if (request.status >= 400) {
            onError(new Error(request.statusText));
          }
          else if (request.status > 0) {
            try {
              const fontObj = fontParser(request.response);
              callback(fontObj);
            } catch (e) {
              onError(e);
            }
          }
        };
        request.onerror = onError;
        request.send();
      } catch(err) {
        onError(err);
      }
    }
    tryLoad();
  }


  /**
   * Load a given font url if needed, invoking a callback when it's loaded. If already
   * loaded, the callback will be called synchronously.
   */
  function loadFont(fontUrl, callback) {
    if (!fontUrl) fontUrl = defaultFontUrl;
    let font = fonts[fontUrl];
    if (font) {
      // if currently loading font, add to callbacks, otherwise execute immediately
      if (font.pending) {
        font.pending.push(callback);
      } else {
        callback(font);
      }
    } else {
      fonts[fontUrl] = {pending: [callback]};
      doLoadFont(fontUrl, fontObj => {
        let callbacks = fonts[fontUrl].pending;
        fonts[fontUrl] = fontObj;
        callbacks.forEach(cb => cb(fontObj));
      });
    }
  }


  /**
   * Get the atlas data for a given font url, loading it from the network and initializing
   * its atlas data objects if necessary.
   */
  function getSdfAtlas(fontUrl, sdfGlyphSize, callback) {
    if (!fontUrl) fontUrl = defaultFontUrl;
    let atlasKey = `${fontUrl}@${sdfGlyphSize}`;
    let atlas = fontAtlases[atlasKey];
    if (atlas) {
      callback(atlas);
    } else {
      loadFont(fontUrl, fontObj => {
        atlas = fontAtlases[atlasKey] || (fontAtlases[atlasKey] = {
          fontObj: fontObj,
          glyphs: {},
          glyphCount: 0
        });
        callback(atlas);
      });
    }
  }


  /**
   * Main entry point.
   * Process a text string with given font and formatting parameters, and return all info
   * necessary to render all its glyphs.
   */
  function process(
    {
      text='',
      font=defaultFontUrl,
      sdfGlyphSize=64,
      fontSize=1,
      letterSpacing=0,
      lineHeight='normal',
      maxWidth=INF,
      textAlign='left',
      textIndent=0,
      whiteSpace='normal',
      overflowWrap='normal',
      anchorX = 0,
      anchorY = 0,
      includeCaretPositions=false,
      chunkedBoundsSize=8192,
      colorRanges=null
    },
    callback,
    metricsOnly=false
  ) {
    const mainStart = now();
    const timings = {total: 0, fontLoad: 0, layout: 0, sdf: {}, sdfTotal: 0};

    // Ensure newlines are normalized
    if (text.indexOf('\r') > -1) {
      console.warn('FontProcessor.process: got text with \\r chars; normalizing to \\n');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    // Ensure we've got numbers not strings
    fontSize = +fontSize;
    letterSpacing = +letterSpacing;
    maxWidth = +maxWidth;
    lineHeight = lineHeight || 'normal';
    textIndent = +textIndent;

    getSdfAtlas(font, sdfGlyphSize, atlas => {
      const fontObj = atlas.fontObj;
      const hasMaxWidth = isFinite(maxWidth);
      let newGlyphs = null;
      let glyphBounds = null;
      let glyphAtlasIndices = null;
      let glyphColors = null;
      let caretPositions = null;
      let totalBounds = null;
      let chunkedBounds = null;
      let maxLineWidth = 0;
      let renderableGlyphCount = 0;
      let canWrap = whiteSpace !== 'nowrap';
      const {ascender, descender, unitsPerEm} = fontObj;
      timings.fontLoad = now() - mainStart;
      const layoutStart = now();

      // Find conversion between native font units and fontSize units; this will already be done
      // for the gx/gy values below but everything else we'll need to convert
      const fontSizeMult = fontSize / unitsPerEm;

      // Determine appropriate value for 'normal' line height based on the font's actual metrics
      // TODO this does not guarantee individual glyphs won't exceed the line height, e.g. Roboto; should we use yMin/Max instead?
      if (lineHeight === 'normal') {
        lineHeight = (ascender - descender) / unitsPerEm;
      }

      // Determine line height and leading adjustments
      lineHeight = lineHeight * fontSize;
      const halfLeading = (lineHeight - (ascender - descender) * fontSizeMult) / 2;
      const topBaseline = -(fontSize + halfLeading);
      const caretHeight = Math.min(lineHeight, (ascender - descender) * fontSizeMult);
      const caretBottomOffset = (ascender + descender) / 2 * fontSizeMult - caretHeight / 2;

      // Distribute glyphs into lines based on wrapping
      let lineXOffset = textIndent;
      let currentLine = new TextLine();
      const lines = [currentLine];
      fontObj.forEachGlyph(text, fontSize, letterSpacing, (glyphObj, glyphX, charIndex) => {
        const char = text.charAt(charIndex);
        const glyphWidth = glyphObj.advanceWidth * fontSizeMult;
        const curLineCount = currentLine.count;
        let nextLine;

        // Calc isWhitespace and isEmpty once per glyphObj
        if (!('isEmpty' in glyphObj)) {
          glyphObj.isWhitespace = !!char && /\s/.test(char);
          glyphObj.isEmpty = glyphObj.xMin === glyphObj.xMax || glyphObj.yMin === glyphObj.yMax;
        }
        if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
          renderableGlyphCount++;
        }

        // If a non-whitespace character overflows the max width, we need to soft-wrap
        if (canWrap && hasMaxWidth && !glyphObj.isWhitespace && glyphX + glyphWidth + lineXOffset > maxWidth && curLineCount) {
          // If it's the first char after a whitespace, start a new line
          if (currentLine.glyphAt(curLineCount - 1).glyphObj.isWhitespace) {
            nextLine = new TextLine();
            lineXOffset = -glyphX;
          } else {
            // Back up looking for a whitespace character to wrap at
            for (let i = curLineCount; i--;) {
              // If we got the start of the line there's no soft break point; make hard break if overflowWrap='break-word'
              if (i === 0 && overflowWrap === 'break-word') {
                nextLine = new TextLine();
                lineXOffset = -glyphX;
                break
              }
              // Found a soft break point; move all chars since it to a new line
              else if (currentLine.glyphAt(i).glyphObj.isWhitespace) {
                nextLine = currentLine.splitAt(i + 1);
                const adjustX = nextLine.glyphAt(0).x;
                lineXOffset -= adjustX;
                for (let j = nextLine.count; j--;) {
                  nextLine.glyphAt(j).x -= adjustX;
                }
                break
              }
            }
          }
          if (nextLine) {
            currentLine.isSoftWrapped = true;
            currentLine = nextLine;
            lines.push(currentLine);
            maxLineWidth = maxWidth; //after soft wrapping use maxWidth as calculated width
          }
        }

        let fly = currentLine.glyphAt(currentLine.count);
        fly.glyphObj = glyphObj;
        fly.x = glyphX + lineXOffset;
        fly.width = glyphWidth;
        fly.charIndex = charIndex;

        // Handle hard line breaks
        if (char === '\n') {
          currentLine = new TextLine();
          lines.push(currentLine);
          lineXOffset = -(glyphX + glyphWidth + (letterSpacing * fontSize)) + textIndent;
        }
      });

      // Calculate width of each line (excluding trailing whitespace) and maximum block width
      lines.forEach(line => {
        for (let i = line.count; i--;) {
          let {glyphObj, x, width} = line.glyphAt(i);
          if (!glyphObj.isWhitespace) {
            line.width = x + width;
            if (line.width > maxLineWidth) {
              maxLineWidth = line.width;
            }
            return
          }
        }
      });

      if (!metricsOnly) {
        // Find overall position adjustments for anchoring
        let anchorXOffset = 0;
        let anchorYOffset = 0;
        if (anchorX) {
          if (typeof anchorX === 'number') {
            anchorXOffset = -anchorX;
          }
          else if (typeof anchorX === 'string') {
            anchorXOffset = -maxLineWidth * (
              anchorX === 'left' ? 0 :
              anchorX === 'center' ? 0.5 :
              anchorX === 'right' ? 1 :
              parsePercent(anchorX)
            );
          }
        }
        if (anchorY) {
          if (typeof anchorY === 'number') {
            anchorYOffset = -anchorY;
          }
          else if (typeof anchorY === 'string') {
            let height = lines.length * lineHeight;
            anchorYOffset = anchorY === 'top' ? 0 :
              anchorY === 'top-baseline' ? -topBaseline :
              anchorY === 'middle' ? height / 2 :
              anchorY === 'bottom' ? height :
              anchorY === 'bottom-baseline' ? height - halfLeading + descender * fontSizeMult :
              parsePercent(anchorY) * height;
          }
        }

        // Process each line, applying alignment offsets, adding each glyph to the atlas, and
        // collecting all renderable glyphs into a single collection.
        glyphBounds = new Float32Array(renderableGlyphCount * 4);
        glyphAtlasIndices = new Float32Array(renderableGlyphCount);
        totalBounds = [INF, INF, -INF, -INF];
        chunkedBounds = [];
        let lineYOffset = topBaseline;
        if (includeCaretPositions) {
          caretPositions = new Float32Array(text.length * 3);
        }
        if (colorRanges) {
          glyphColors = new Uint8Array(renderableGlyphCount * 3);
        }
        let renderableGlyphIndex = 0;
        let prevCharIndex = -1;
        let colorCharIndex = -1;
        let chunk;
        let currentColor;
        lines.forEach(line => {
          const {count:lineGlyphCount, width:lineWidth} = line;

          // Ignore empty lines
          if (lineGlyphCount > 0) {
            // Find x offset for horizontal alignment
            let lineXOffset = 0;
            let justifyAdjust = 0;
            if (textAlign === 'center') {
              lineXOffset = (maxLineWidth - lineWidth) / 2;
            } else if (textAlign === 'right') {
              lineXOffset = maxLineWidth - lineWidth;
            } else if (textAlign === 'justify' && line.isSoftWrapped) {
              // just count the non-trailing whitespace characters, and we'll adjust the offsets per
              // character in the next loop
              let whitespaceCount = 0;
              for (let i = lineGlyphCount; i--;) {
                if (!line.glyphAt(i).glyphObj.isWhitespace) {
                  while (i--) {
                    if (!line.glyphAt(i).glyphObj) {
                      debugger
                    }
                    if (line.glyphAt(i).glyphObj.isWhitespace) {
                      whitespaceCount++;
                    }
                  }
                  break
                }
              }
              justifyAdjust = (maxLineWidth - lineWidth) / whitespaceCount;
            }

            for (let i = 0; i < lineGlyphCount; i++) {
              const glyphInfo = line.glyphAt(i);
              const glyphObj = glyphInfo.glyphObj;

              // Apply position adjustments
              if (lineXOffset) glyphInfo.x += lineXOffset;

              // Expand whitespaces for justify alignment
              if (justifyAdjust !== 0 && glyphObj.isWhitespace) {
                lineXOffset += justifyAdjust;
                glyphInfo.width += justifyAdjust;
              }

              // Add caret positions
              if (includeCaretPositions) {
                const {charIndex} = glyphInfo;
                caretPositions[charIndex * 3] = glyphInfo.x + anchorXOffset; //left edge x
                caretPositions[charIndex * 3 + 1] = glyphInfo.x + glyphInfo.width + anchorXOffset; //right edge x
                caretPositions[charIndex * 3 + 2] = lineYOffset + caretBottomOffset + anchorYOffset; //common bottom y

                // If we skipped any chars from the previous glyph (due to ligature subs), copy the
                // previous glyph's info to those missing char indices. In the future we may try to
                // use the font's LigatureCaretList table to get interior caret positions.
                while (charIndex - prevCharIndex > 1) {
                  caretPositions[(prevCharIndex + 1) * 3] = caretPositions[prevCharIndex * 3 + 1];
                  caretPositions[(prevCharIndex + 1) * 3 + 1] = caretPositions[prevCharIndex * 3 + 1];
                  caretPositions[(prevCharIndex + 1) * 3 + 2] = caretPositions[prevCharIndex * 3 + 2];
                  prevCharIndex++;
                }
                prevCharIndex = charIndex;
              }

              // Track current color range
              if (colorRanges) {
                const {charIndex} = glyphInfo;
                while(charIndex > colorCharIndex) {
                  colorCharIndex++;
                  if (colorRanges.hasOwnProperty(colorCharIndex)) {
                    currentColor = colorRanges[colorCharIndex];
                  }
                }
              }

              // Get atlas data for renderable glyphs
              if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
                const idx = renderableGlyphIndex++;

                // If we haven't seen this glyph yet, generate its SDF
                let glyphAtlasInfo = atlas.glyphs[glyphObj.index];
                if (!glyphAtlasInfo) {
                  const sdfStart = now();
                  const glyphSDFData = sdfGenerator(glyphObj, sdfGlyphSize);
                  timings.sdf[text.charAt(glyphInfo.charIndex)] = now() - sdfStart;

                  // Assign this glyph the next available atlas index
                  glyphSDFData.atlasIndex = atlas.glyphCount++;

                  // Queue it up in the response's newGlyphs list
                  if (!newGlyphs) newGlyphs = [];
                  newGlyphs.push(glyphSDFData);

                  // Store its metadata (not the texture) in our atlas info
                  glyphAtlasInfo = atlas.glyphs[glyphObj.index] = {
                    atlasIndex: glyphSDFData.atlasIndex,
                    glyphObj: glyphObj,
                    renderingBounds: glyphSDFData.renderingBounds
                  };
                }

                // Determine final glyph bounds and add them to the glyphBounds array
                const bounds = glyphAtlasInfo.renderingBounds;
                const start = idx * 4;
                const x0 = glyphBounds[start] = glyphInfo.x + bounds[0] * fontSizeMult + anchorXOffset;
                const y0 = glyphBounds[start + 1] = lineYOffset + bounds[1] * fontSizeMult + anchorYOffset;
                const x1 = glyphBounds[start + 2] = glyphInfo.x + bounds[2] * fontSizeMult + anchorXOffset;
                const y1 = glyphBounds[start + 3] = lineYOffset + bounds[3] * fontSizeMult + anchorYOffset;

                // Track total bounds
                if (x0 < totalBounds[0]) totalBounds[0] = x0;
                if (y0 < totalBounds[1]) totalBounds[1] = y0;
                if (x1 > totalBounds[2]) totalBounds[2] = x1;
                if (y1 > totalBounds[3]) totalBounds[3] = y1;

                // Track bounding rects for each chunk of N glyphs
                if (idx % chunkedBoundsSize === 0) {
                  chunk = {start: idx, end: idx, rect: [INF, INF, -INF, -INF]};
                  chunkedBounds.push(chunk);
                }
                chunk.end++;
                if (x0 < chunk.rect[0]) chunk.rect[0] = x0;
                if (y0 < chunk.rect[1]) chunk.rect[1] = y0;
                if (x1 > chunk.rect[2]) chunk.rect[2] = x1;
                if (y1 > chunk.rect[3]) chunk.rect[3] = y1;

                // Add to atlas indices array
                glyphAtlasIndices[idx] = glyphAtlasInfo.atlasIndex;

                // Add colors
                if (colorRanges) {
                  const start = idx * 3;
                  glyphColors[start] = currentColor >> 16 & 255;
                  glyphColors[start + 1] = currentColor >> 8 & 255;
                  glyphColors[start + 2] = currentColor & 255;
                }
              }
            }
          }

          // Increment y offset for next line
          lineYOffset -= lineHeight;
        });
      }

      // Timing stats
      for (let ch in timings.sdf) {
        timings.sdfTotal += timings.sdf[ch];
      }
      timings.layout = now() - layoutStart - timings.sdfTotal;
      timings.total = now() - mainStart;

      callback({
        glyphBounds, //rendering quad bounds for each glyph [x1, y1, x2, y2]
        glyphAtlasIndices, //atlas indices for each glyph
        caretPositions, //x,y of bottom of cursor position before each char, plus one after last char
        caretHeight, //height of cursor from bottom to top
        glyphColors, //color for each glyph, if color ranges supplied
        chunkedBounds, //total rects per (n=chunkedBoundsSize) consecutive glyphs
        ascender: ascender * fontSizeMult, //font ascender
        descender: descender * fontSizeMult, //font descender
        lineHeight, //computed line height
        topBaseline, //y coordinate of the top line's baseline
        totalBounds, //total rect including all glyphBounds; will be slightly larger than glyph edges due to SDF padding
        totalBlockSize: [maxLineWidth, lines.length * lineHeight], //width and height of the text block; accurate for layout measurement
        newGlyphSDFs: newGlyphs, //if this request included any new SDFs for the atlas, they'll be included here
        timings
      });
    });
  }


  /**
   * For a given text string and font parameters, determine the resulting block dimensions
   * after wrapping for the given maxWidth.
   * @param args
   * @param callback
   */
  function measure(args, callback) {
    process(args, (result) => {
      callback({
        width: result.totalBlockSize[0],
        height: result.totalBlockSize[1]
      });
    }, {metricsOnly: true});
  }

  function parsePercent(str) {
    let match = str.match(/^([\d.]+)%$/);
    let pct = match ? parseFloat(match[1]) : NaN;
    return isNaN(pct) ? 0 : pct / 100
  }

  function now() {
    return (self.performance || Date).now()
  }

  // Array-backed structure for a single line's glyphs data
  function TextLine() {
    this.data = [];
  }
  TextLine.prototype = {
    width: 0,
    isSoftWrapped: false,
    get count() {
      return Math.ceil(this.data.length / 4)
    },
    glyphAt(i) {
      let fly = TextLine.flyweight;
      fly.data = this.data;
      fly.index = i;
      return fly
    },
    splitAt(i) {
      let newLine = new TextLine();
      newLine.data = this.data.splice(i * 4);
      return newLine
    }
  };
  TextLine.flyweight = ['glyphObj', 'x', 'width', 'charIndex'].reduce((obj, prop, i, all) => {
    Object.defineProperty(obj, prop, {
      get() {
        return this.data[this.index * 4 + i]
      },
      set(val) {
        this.data[this.index * 4 + i] = val;
      }
    });
    return obj
  }, {data: null, index: 0});


  return {
    process,
    measure,
    loadFont
  }
}

/**
 * Basic quadtree impl for performing fast spatial searches of a glyph's line segments.
 */
function createGlyphSegmentsQuadtree(glyphObj) {
  // Pick a good initial power-of-two bounding box that will hold all possible segments
  const {xMin, yMin, xMax, yMax} = glyphObj;
  const dx = xMax - xMin;
  const dy = yMax - yMin;
  const cx = Math.round(xMin + dx / 2);
  const cy = Math.round(yMin + dy / 2);
  const r = Math.pow(2, Math.floor(Math.log(Math.max(dx, dy)) * Math.LOG2E));
  const INF = Infinity;

  const root = {
    0: null,
    1: null,
    2: null,
    3: null,
    data: null,
    cx: cx,
    cy: cy,
    r: r,
    minX: INF,
    minY: INF,
    maxX: -INF,
    maxY: -INF
  };

  /**
   * Add a line segment to the quadtree.
   * @param x0
   * @param y0
   * @param x1
   * @param y1
   */
  function addLineSegment(x0, y0, x1, y1) {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const segment = {
      x0, y0, x1, y1, cx, cy,
      minX: Math.min(x0, x1),
      minY: Math.min(y0, y1),
      maxX: Math.max(x0, x1),
      maxY: Math.max(y0, y1),
      next: null
    };
    insertSegment(segment, root);
  }

  function insertSegment(segment, node) {
    // update node min/max stats
    const {minX, minY, maxX, maxY, cx, cy} = segment;
    if (minX < node.minX) node.minX = minX;
    if (minY < node.minY) node.minY = minY;
    if (maxX > node.maxX) node.maxX = maxX;
    if (maxY > node.maxY) node.maxY = maxY;

    // leaf
    let leafSegment = node.data;
    if (leafSegment) {
      // coincident; push as linked list
      if (leafSegment.cx === cx && leafSegment.cy === cy) {
        while (leafSegment.next) leafSegment = leafSegment.next;
        leafSegment.next = segment;
      }
      // non-coincident; split leaf to branch
      else {
        node.data = null;
        insertSegment(leafSegment, node);
        insertSegment(segment, node);
      }
    }
    // branch
    else {
      // find target sub-index for the segment's centerpoint
      const subIndex = (cy < node.cy ? 0 : 2) + (cx < node.cx ? 0 : 1);

      // subnode already at index: recurse
      if (node[subIndex]) {
        insertSegment(segment, node[subIndex]);
      }
      // create new leaf
      else {
        node[subIndex] = {
          0: null,
          1: null,
          2: null,
          3: null,
          data: segment,
          cx: node.cx + node.r / 2 * (subIndex % 2 ? 1 : -1),
          cy: node.cy + node.r / 2 * (subIndex < 2 ? -1 : 1),
          r: node.r / 2,
          minX: minX,
          minY: minY,
          maxX: maxX,
          maxY: maxY
        };
      }
    }
  }

  function walkTree(callback) {
    walkBranch(root, callback);
  }

  function walkBranch(root, callback) {
    if (callback(root) !== false && !root.data) {
      for (let i = 0; i < 4; i++) {
        if (root[i] !== null) {
          walkBranch(root[i], callback);
        }
      }
    }
  }

  /**
   * For a given x/y, search the quadtree for the closest line segment and return
   * its signed distance.
   * @param x
   * @param y
   * @param maxSearchRadius
   * @returns {number}
   */
  function findNearestSignedDistance(x, y, maxSearchRadius) {
    let closestDist = maxSearchRadius;
    let closestDistSq = closestDist * closestDist;

    walkTree(function visit(node) {
      // Ignore nodes that can't possibly have segments closer than what we've already found. We base
      // this on a simple rect bounds check; radial would be more accurate but much slower.
      if (
        x - closestDist > node.maxX || x + closestDist < node.minX ||
        y - closestDist > node.maxY || y + closestDist < node.minY
      ) {
        return false
      }

      // Leaf - check each segment's actual distance
      for (let segment = node.data; segment; segment = segment.next) {
        const distSq = absSquareDistanceToLineSegment(x, y, segment.x0, segment.y0, segment.x1, segment.y1);
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestDist = Math.sqrt(distSq);
        }
      }
    });

    // Flip to negative distance if outside the poly
    if (!isPointInPoly(x, y)) {
      closestDist = -closestDist;
    }
    return closestDist
  }

  // Determine whether the given point lies inside or outside the glyph. Uses a simple
  // ray casting algorithm using a ray pointing east from the point, optimized by using
  // the quadtree search to test as few lines as possible.
  function isPointInPoly(x, y) {
    let inside = false;
    walkTree(node => {
      // Ignore nodes whose bounds can't possibly cross our east-pointing ray
      if (node.maxX < x || node.minY > y || node.maxY < y) {
        return false
      }

      // Leaf - test each segment for whether it crosses our east-pointing ray
      for (let segment = node.data; segment; segment = segment.next) {
        const {x0, y0, x1, y1} = segment;
        const intersects = ((y0 > y) !== (y1 > y)) && (x < (x1 - x0) * (y - y0) / (y1 - y0) + x0);
        if (intersects) {
          inside = !inside;
        }
      }
    });
    return inside
  }

  // Find the absolute distance from a point to a line segment at closest approach
  function absSquareDistanceToLineSegment(x, y, lineX0, lineY0, lineX1, lineY1) {
    const ldx = lineX1 - lineX0;
    const ldy = lineY1 - lineY0;
    const lengthSq = ldx * ldx + ldy * ldy;
    const t = lengthSq ? Math.max(0, Math.min(1, ((x - lineX0) * ldx + (y - lineY0) * ldy) / lengthSq)) : 0;
    const dx = x - (lineX0 + t * ldx);
    const dy = y - (lineY0 + t * ldy);
    return dx * dx + dy * dy
  }

  return {
    addLineSegment,
    findNearestSignedDistance
  }
}

// Custom bundle of Typr.js (https://github.com/photopea/Typr.js) for use in troika-3d-text.
// Original MIT license applies: https://github.com/photopea/Typr.js/blob/gh-pages/LICENSE

function typrFactory() {

const window = self;

// Begin Typr.js


var Typr = {};

Typr.parse = function(buff)
{
	var bin = Typr._bin;
	var data = new Uint8Array(buff);

	var tag = bin.readASCII(data, 0, 4);
	if(tag=="ttcf") {
		var offset = 4;
		var majV = bin.readUshort(data, offset);  offset+=2;
		var minV = bin.readUshort(data, offset);  offset+=2;
		var numF = bin.readUint  (data, offset);  offset+=4;
		var fnts = [];
		for(var i=0; i<numF; i++) {
			var foff = bin.readUint  (data, offset);  offset+=4;
			fnts.push(Typr._readFont(data, foff));
		}
		return fnts;
	}
	else return [Typr._readFont(data, 0)];
};

Typr._readFont = function(data, offset) {
	var bin = Typr._bin;
	var ooff = offset;

	var sfnt_version = bin.readFixed(data, offset);
	offset += 4;
	var numTables = bin.readUshort(data, offset);
	offset += 2;
	var searchRange = bin.readUshort(data, offset);
	offset += 2;
	var entrySelector = bin.readUshort(data, offset);
	offset += 2;
	var rangeShift = bin.readUshort(data, offset);
	offset += 2;

	var tags = [
		"cmap",
		"head",
		"hhea",
		"maxp",
		"hmtx",
		"name",
		"OS/2",
		"post",

		//"cvt",
		//"fpgm",
		"loca",
		"glyf",
		"kern",

		//"prep"
		//"gasp"

		"CFF ",


		"GPOS",
		"GSUB",

		"SVG "
		//"VORG",
		];

	var obj = {_data:data, _offset:ooff};
	//console.log(sfnt_version, numTables, searchRange, entrySelector, rangeShift);

	var tabs = {};

	for(var i=0; i<numTables; i++)
	{
		var tag = bin.readASCII(data, offset, 4);   offset += 4;
		var checkSum = bin.readUint(data, offset);  offset += 4;
		var toffset = bin.readUint(data, offset);   offset += 4;
		var length = bin.readUint(data, offset);    offset += 4;
		tabs[tag] = {offset:toffset, length:length};

		//if(tags.indexOf(tag)==-1) console.log("unknown tag", tag, length);
	}

	for(var i=0; i< tags.length; i++)
	{
		var t = tags[i];
		//console.log(t);
		//if(tabs[t]) console.log(t, tabs[t].offset, tabs[t].length);
		if(tabs[t]) obj[t.trim()] = Typr[t.trim()].parse(data, tabs[t].offset, tabs[t].length, obj);
	}

	return obj;
};

Typr._tabOffset = function(data, tab, foff)
{
	var bin = Typr._bin;
	var numTables = bin.readUshort(data, foff+4);
	var offset = foff+12;
	for(var i=0; i<numTables; i++)
	{
		var tag = bin.readASCII(data, offset, 4);   offset += 4;
		var checkSum = bin.readUint(data, offset);  offset += 4;
		var toffset = bin.readUint(data, offset);   offset += 4;
		var length = bin.readUint(data, offset);    offset += 4;
		if(tag==tab) return toffset;
	}
	return 0;
};





Typr._bin = {
	readFixed : function(data, o)
	{
		return ((data[o]<<8) | data[o+1]) +  (((data[o+2]<<8)|data[o+3])/(256*256+4));
	},
	readF2dot14 : function(data, o)
	{
		var num = Typr._bin.readShort(data, o);
		return num / 16384;
	},
	readInt : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		var a = Typr._bin.t.uint8;
		a[0] = buff[p+3];
		a[1] = buff[p+2];
		a[2] = buff[p+1];
		a[3] = buff[p];
		return Typr._bin.t.int32[0];
	},

	readInt8 : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		var a = Typr._bin.t.uint8;
		a[0] = buff[p];
		return Typr._bin.t.int8[0];
	},
	readShort : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		var a = Typr._bin.t.uint8;
		a[1] = buff[p]; a[0] = buff[p+1];
		return Typr._bin.t.int16[0];
	},
	readUshort : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		return (buff[p]<<8) | buff[p+1];
	},
	readUshorts : function(buff, p, len)
	{
		var arr = [];
		for(var i=0; i<len; i++) arr.push(Typr._bin.readUshort(buff, p+i*2));
		return arr;
	},
	readUint : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		var a = Typr._bin.t.uint8;
		a[3] = buff[p];  a[2] = buff[p+1];  a[1] = buff[p+2];  a[0] = buff[p+3];
		return Typr._bin.t.uint32[0];
	},
	readUint64 : function(buff, p)
	{
		//if(p>=buff.length) throw "error";
		return (Typr._bin.readUint(buff, p)*(0xffffffff+1)) + Typr._bin.readUint(buff, p+4);
	},
	readASCII : function(buff, p, l)	// l : length in Characters (not Bytes)
	{
		//if(p>=buff.length) throw "error";
		var s = "";
		for(var i = 0; i < l; i++) s += String.fromCharCode(buff[p+i]);
		return s;
	},
	readUnicode : function(buff, p, l)
	{
		//if(p>=buff.length) throw "error";
		var s = "";
		for(var i = 0; i < l; i++)
		{
			var c = (buff[p++]<<8) | buff[p++];
			s += String.fromCharCode(c);
		}
		return s;
	},
	_tdec : window["TextDecoder"] ? new window["TextDecoder"]() : null,
	readUTF8 : function(buff, p, l) {
		var tdec = Typr._bin._tdec;
		if(tdec && p==0 && l==buff.length) return tdec["decode"](buff);
		return Typr._bin.readASCII(buff,p,l);
	},
	readBytes : function(buff, p, l)
	{
		//if(p>=buff.length) throw "error";
		var arr = [];
		for(var i=0; i<l; i++) arr.push(buff[p+i]);
		return arr;
	},
	readASCIIArray : function(buff, p, l)	// l : length in Characters (not Bytes)
	{
		//if(p>=buff.length) throw "error";
		var s = [];
		for(var i = 0; i < l; i++)
			s.push(String.fromCharCode(buff[p+i]));
		return s;
	}
};

Typr._bin.t = {
	buff: new ArrayBuffer(8),
};
Typr._bin.t.int8   = new Int8Array  (Typr._bin.t.buff);
Typr._bin.t.uint8  = new Uint8Array (Typr._bin.t.buff);
Typr._bin.t.int16  = new Int16Array (Typr._bin.t.buff);
Typr._bin.t.uint16 = new Uint16Array(Typr._bin.t.buff);
Typr._bin.t.int32  = new Int32Array (Typr._bin.t.buff);
Typr._bin.t.uint32 = new Uint32Array(Typr._bin.t.buff);





// OpenType Layout Common Table Formats

Typr._lctf = {};

Typr._lctf.parse = function(data, offset, length, font, subt)
{
	var bin = Typr._bin;
	var obj = {};
	var offset0 = offset;
	var tableVersion = bin.readFixed(data, offset);  offset += 4;

	var offScriptList  = bin.readUshort(data, offset);  offset += 2;
	var offFeatureList = bin.readUshort(data, offset);  offset += 2;
	var offLookupList  = bin.readUshort(data, offset);  offset += 2;


	obj.scriptList  = Typr._lctf.readScriptList (data, offset0 + offScriptList);
	obj.featureList = Typr._lctf.readFeatureList(data, offset0 + offFeatureList);
	obj.lookupList  = Typr._lctf.readLookupList (data, offset0 + offLookupList, subt);

	return obj;
};

Typr._lctf.readLookupList = function(data, offset, subt)
{
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = [];
	var count = bin.readUshort(data, offset);  offset+=2;
	for(var i=0; i<count; i++)
	{
		var noff = bin.readUshort(data, offset);  offset+=2;
		var lut = Typr._lctf.readLookupTable(data, offset0 + noff, subt);
		obj.push(lut);
	}
	return obj;
};

Typr._lctf.readLookupTable = function(data, offset, subt)
{
	//console.log("Parsing lookup table", offset);
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = {tabs:[]};

	obj.ltype = bin.readUshort(data, offset);  offset+=2;
	obj.flag  = bin.readUshort(data, offset);  offset+=2;
	var cnt   = bin.readUshort(data, offset);  offset+=2;

	for(var i=0; i<cnt; i++)
	{
		var noff = bin.readUshort(data, offset);  offset+=2;
		var tab = subt(data, obj.ltype, offset0 + noff);
		//console.log(obj.type, tab);
		obj.tabs.push(tab);
	}
	return obj;
};

Typr._lctf.numOfOnes = function(n)
{
	var num = 0;
	for(var i=0; i<32; i++) if(((n>>>i)&1) != 0) num++;
	return num;
};

Typr._lctf.readClassDef = function(data, offset)
{
	var bin = Typr._bin;
	var obj = [];
	var format = bin.readUshort(data, offset);  offset+=2;
	if(format==1)
	{
		var startGlyph  = bin.readUshort(data, offset);  offset+=2;
		var glyphCount  = bin.readUshort(data, offset);  offset+=2;
		for(var i=0; i<glyphCount; i++)
		{
			obj.push(startGlyph+i);
			obj.push(startGlyph+i);
			obj.push(bin.readUshort(data, offset));  offset+=2;
		}
	}
	if(format==2)
	{
		var count = bin.readUshort(data, offset);  offset+=2;
		for(var i=0; i<count; i++)
		{
			obj.push(bin.readUshort(data, offset));  offset+=2;
			obj.push(bin.readUshort(data, offset));  offset+=2;
			obj.push(bin.readUshort(data, offset));  offset+=2;
		}
	}
	return obj;
};
Typr._lctf.getInterval = function(tab, val)
{
	for(var i=0; i<tab.length; i+=3)
	{
		var start = tab[i], end = tab[i+1], index = tab[i+2];
		if(start<=val && val<=end) return i;
	}
	return -1;
};


Typr._lctf.readCoverage = function(data, offset)
{
	var bin = Typr._bin;
	var cvg = {};
	cvg.fmt   = bin.readUshort(data, offset);  offset+=2;
	var count = bin.readUshort(data, offset);  offset+=2;
	//console.log("parsing coverage", offset-4, format, count);
	if(cvg.fmt==1) cvg.tab = bin.readUshorts(data, offset, count);
	if(cvg.fmt==2) cvg.tab = bin.readUshorts(data, offset, count*3);
	return cvg;
};

Typr._lctf.coverageIndex = function(cvg, val)
{
	var tab = cvg.tab;
	if(cvg.fmt==1) return tab.indexOf(val);
	if(cvg.fmt==2) {
		var ind = Typr._lctf.getInterval(tab, val);
		if(ind!=-1) return tab[ind+2] + (val - tab[ind]);
	}
	return -1;
};

Typr._lctf.readFeatureList = function(data, offset)
{
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = [];

	var count = bin.readUshort(data, offset);  offset+=2;

	for(var i=0; i<count; i++)
	{
		var tag = bin.readASCII(data, offset, 4);  offset+=4;
		var noff = bin.readUshort(data, offset);  offset+=2;
		obj.push({tag: tag.trim(), tab:Typr._lctf.readFeatureTable(data, offset0 + noff)});
	}
	return obj;
};

Typr._lctf.readFeatureTable = function(data, offset)
{
	var bin = Typr._bin;

	var featureParams = bin.readUshort(data, offset);  offset+=2;	// = 0
	var lookupCount = bin.readUshort(data, offset);  offset+=2;

	var indices = [];
	for(var i=0; i<lookupCount; i++) indices.push(bin.readUshort(data, offset+2*i));
	return indices;
};


Typr._lctf.readScriptList = function(data, offset)
{
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = {};

	var count = bin.readUshort(data, offset);  offset+=2;

	for(var i=0; i<count; i++)
	{
		var tag = bin.readASCII(data, offset, 4);  offset+=4;
		var noff = bin.readUshort(data, offset);  offset+=2;
		obj[tag.trim()] = Typr._lctf.readScriptTable(data, offset0 + noff);
	}
	return obj;
};

Typr._lctf.readScriptTable = function(data, offset)
{
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = {};

	var defLangSysOff = bin.readUshort(data, offset);  offset+=2;
	obj.default = Typr._lctf.readLangSysTable(data, offset0 + defLangSysOff);

	var langSysCount = bin.readUshort(data, offset);  offset+=2;

	for(var i=0; i<langSysCount; i++)
	{
		var tag = bin.readASCII(data, offset, 4);  offset+=4;
		var langSysOff = bin.readUshort(data, offset);  offset+=2;
		obj[tag.trim()] = Typr._lctf.readLangSysTable(data, offset0 + langSysOff);
	}
	return obj;
};

Typr._lctf.readLangSysTable = function(data, offset)
{
	var bin = Typr._bin;
	var obj = {};

	var lookupOrder = bin.readUshort(data, offset);  offset+=2;
	//if(lookupOrder!=0)  throw "lookupOrder not 0";
	obj.reqFeature = bin.readUshort(data, offset);  offset+=2;
	//if(obj.reqFeature != 0xffff) throw "reqFeatureIndex != 0xffff";

	//console.log(lookupOrder, obj.reqFeature);

	var featureCount = bin.readUshort(data, offset);  offset+=2;
	obj.features = bin.readUshorts(data, offset, featureCount);
	return obj;
};

	Typr.CFF = {};
	Typr.CFF.parse = function(data, offset, length)
	{
		var bin = Typr._bin;

		data = new Uint8Array(data.buffer, offset, length);
		offset = 0;

		// Header
		var major = data[offset];  offset++;
		var minor = data[offset];  offset++;
		var hdrSize = data[offset];  offset++;
		var offsize = data[offset];  offset++;
		//console.log(major, minor, hdrSize, offsize);

		// Name INDEX
		var ninds = [];
		offset = Typr.CFF.readIndex(data, offset, ninds);
		var names = [];

		for(var i=0; i<ninds.length-1; i++) names.push(bin.readASCII(data, offset+ninds[i], ninds[i+1]-ninds[i]));
		offset += ninds[ninds.length-1];


		// Top DICT INDEX
		var tdinds = [];
		offset = Typr.CFF.readIndex(data, offset, tdinds);  //console.log(tdinds);
		// Top DICT Data
		var topDicts = [];
		for(var i=0; i<tdinds.length-1; i++) topDicts.push( Typr.CFF.readDict(data, offset+tdinds[i], offset+tdinds[i+1]) );
		offset += tdinds[tdinds.length-1];
		var topdict = topDicts[0];
		//console.log(topdict);

		// String INDEX
		var sinds = [];
		offset = Typr.CFF.readIndex(data, offset, sinds);
		// String Data
		var strings = [];
		for(var i=0; i<sinds.length-1; i++) strings.push(bin.readASCII(data, offset+sinds[i], sinds[i+1]-sinds[i]));
		offset += sinds[sinds.length-1];

		// Global Subr INDEX  (subroutines)
		Typr.CFF.readSubrs(data, offset, topdict);

		// charstrings
		if(topdict.CharStrings)
		{
			offset = topdict.CharStrings;
			var sinds = [];
			offset = Typr.CFF.readIndex(data, offset, sinds);

			var cstr = [];
			for(var i=0; i<sinds.length-1; i++) cstr.push(bin.readBytes(data, offset+sinds[i], sinds[i+1]-sinds[i]));
			//offset += sinds[sinds.length-1];
			topdict.CharStrings = cstr;
			//console.log(topdict.CharStrings);
		}

		// CID font
		if(topdict.ROS) {
			offset = topdict.FDArray;
			var fdind = [];
			offset = Typr.CFF.readIndex(data, offset, fdind);

			topdict.FDArray = [];
			for(var i=0; i<fdind.length-1; i++) {
				var dict = Typr.CFF.readDict(data, offset+fdind[i], offset+fdind[i+1]);
				Typr.CFF._readFDict(data, dict, strings);
				topdict.FDArray.push( dict );
			}
			offset += fdind[fdind.length-1];

			offset = topdict.FDSelect;
			topdict.FDSelect = [];
			var fmt = data[offset];  offset++;
			if(fmt==3) {
				var rns = bin.readUshort(data, offset);  offset+=2;
				for(var i=0; i<rns+1; i++) {
					topdict.FDSelect.push(bin.readUshort(data, offset), data[offset+2]);  offset+=3;
				}
			}
			else throw fmt;
		}

		// Encoding
		if(topdict.Encoding) topdict.Encoding = Typr.CFF.readEncoding(data, topdict.Encoding, topdict.CharStrings.length);

		// charset
		if(topdict.charset ) topdict.charset  = Typr.CFF.readCharset (data, topdict.charset , topdict.CharStrings.length);

		Typr.CFF._readFDict(data, topdict, strings);
		return topdict;
	};
	Typr.CFF._readFDict = function(data, dict, ss) {
		var offset;
		if(dict.Private) {
			offset = dict.Private[1];
			dict.Private = Typr.CFF.readDict(data, offset, offset+dict.Private[0]);
			if(dict.Private.Subrs)  Typr.CFF.readSubrs(data, offset+dict.Private.Subrs, dict.Private);
		}
		for(var p in dict) if(["FamilyName","FontName","FullName","Notice","version","Copyright"].indexOf(p)!=-1)  dict[p]=ss[dict[p] -426 + 35];
	};

	Typr.CFF.readSubrs = function(data, offset, obj)
	{
		var bin = Typr._bin;
		var gsubinds = [];
		offset = Typr.CFF.readIndex(data, offset, gsubinds);

		var bias, nSubrs = gsubinds.length;
		if (nSubrs <  1240) bias = 107;
		else if (nSubrs < 33900) bias = 1131;
		else bias = 32768;
		obj.Bias = bias;

		obj.Subrs = [];
		for(var i=0; i<gsubinds.length-1; i++) obj.Subrs.push(bin.readBytes(data, offset+gsubinds[i], gsubinds[i+1]-gsubinds[i]));
		//offset += gsubinds[gsubinds.length-1];
	};

	Typr.CFF.tableSE = [
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      1,   2,   3,   4,   5,   6,   7,   8,
      9,  10,  11,  12,  13,  14,  15,  16,
     17,  18,  19,  20,  21,  22,  23,  24,
     25,  26,  27,  28,  29,  30,  31,  32,
     33,  34,  35,  36,  37,  38,  39,  40,
     41,  42,  43,  44,  45,  46,  47,  48,
     49,  50,  51,  52,  53,  54,  55,  56,
     57,  58,  59,  60,  61,  62,  63,  64,
     65,  66,  67,  68,  69,  70,  71,  72,
     73,  74,  75,  76,  77,  78,  79,  80,
     81,  82,  83,  84,  85,  86,  87,  88,
     89,  90,  91,  92,  93,  94,  95,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0,  96,  97,  98,  99, 100, 101, 102,
    103, 104, 105, 106, 107, 108, 109, 110,
      0, 111, 112, 113, 114,   0, 115, 116,
    117, 118, 119, 120, 121, 122,   0, 123,
      0, 124, 125, 126, 127, 128, 129, 130,
    131,   0, 132, 133,   0, 134, 135, 136,
    137,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,
      0, 138,   0, 139,   0,   0,   0,   0,
    140, 141, 142, 143,   0,   0,   0,   0,
      0, 144,   0,   0,   0, 145,   0,   0,
    146, 147, 148, 149,   0,   0,   0,   0
  ];

	Typr.CFF.glyphByUnicode = function(cff, code)
	{
		for(var i=0; i<cff.charset.length; i++) if(cff.charset[i]==code) return i;
		return -1;
	};

	Typr.CFF.glyphBySE = function(cff, charcode)	// glyph by standard encoding
	{
		if ( charcode < 0 || charcode > 255 ) return -1;
		return Typr.CFF.glyphByUnicode(cff, Typr.CFF.tableSE[charcode]);
	};

	Typr.CFF.readEncoding = function(data, offset, num)
	{
		var bin = Typr._bin;

		var array = ['.notdef'];
		var format = data[offset];  offset++;
		//console.log("Encoding");
		//console.log(format);

		if(format==0)
		{
			var nCodes = data[offset];  offset++;
			for(var i=0; i<nCodes; i++)  array.push(data[offset+i]);
		}
		/*
		else if(format==1 || format==2)
		{
			while(charset.length<num)
			{
				var first = bin.readUshort(data, offset);  offset+=2;
				var nLeft=0;
				if(format==1) {  nLeft = data[offset];  offset++;  }
				else          {  nLeft = bin.readUshort(data, offset);  offset+=2;  }
				for(var i=0; i<=nLeft; i++)  {  charset.push(first);  first++;  }
			}
		}
		*/
		else throw "error: unknown encoding format: " + format;

		return array;
	};

	Typr.CFF.readCharset = function(data, offset, num)
	{
		var bin = Typr._bin;

		var charset = ['.notdef'];
		var format = data[offset];  offset++;

		if(format==0)
		{
			for(var i=0; i<num; i++)
			{
				var first = bin.readUshort(data, offset);  offset+=2;
				charset.push(first);
			}
		}
		else if(format==1 || format==2)
		{
			while(charset.length<num)
			{
				var first = bin.readUshort(data, offset);  offset+=2;
				var nLeft=0;
				if(format==1) {  nLeft = data[offset];  offset++;  }
				else          {  nLeft = bin.readUshort(data, offset);  offset+=2;  }
				for(var i=0; i<=nLeft; i++)  {  charset.push(first);  first++;  }
			}
		}
		else throw "error: format: " + format;

		return charset;
	};

	Typr.CFF.readIndex = function(data, offset, inds)
	{
		var bin = Typr._bin;

		var count = bin.readUshort(data, offset)+1;  offset+=2;
		var offsize = data[offset];  offset++;

		if     (offsize==1) for(var i=0; i<count; i++) inds.push( data[offset+i] );
		else if(offsize==2) for(var i=0; i<count; i++) inds.push( bin.readUshort(data, offset+i*2) );
		else if(offsize==3) for(var i=0; i<count; i++) inds.push( bin.readUint  (data, offset+i*3 - 1) & 0x00ffffff );
		else if(count!=1) throw "unsupported offset size: " + offsize + ", count: " + count;

		offset += count*offsize;
		return offset-1;
	};

	Typr.CFF.getCharString = function(data, offset, o)
	{
		var bin = Typr._bin;

		var b0 = data[offset], b1 = data[offset+1], b2 = data[offset+2], b3 = data[offset+3], b4=data[offset+4];
		var vs = 1;
		var op=null, val=null;
		// operand
		if(b0<=20) { op = b0;  vs=1;  }
		if(b0==12) { op = b0*100+b1;  vs=2;  }
		//if(b0==19 || b0==20) { op = b0/*+" "+b1*/;  vs=2; }
		if(21 <=b0 && b0<= 27) { op = b0;  vs=1; }
		if(b0==28) { val = bin.readShort(data,offset+1);  vs=3; }
		if(29 <=b0 && b0<= 31) { op = b0;  vs=1; }
		if(32 <=b0 && b0<=246) { val = b0-139;  vs=1; }
		if(247<=b0 && b0<=250) { val = (b0-247)*256+b1+108;  vs=2; }
		if(251<=b0 && b0<=254) { val =-(b0-251)*256-b1-108;  vs=2; }
		if(b0==255) {  val = bin.readInt(data, offset+1)/0xffff;  vs=5;   }

		o.val = val!=null ? val : "o"+op;
		o.size = vs;
	};

	Typr.CFF.readCharString = function(data, offset, length)
	{
		var end = offset + length;
		var bin = Typr._bin;
		var arr = [];

		while(offset<end)
		{
			var b0 = data[offset], b1 = data[offset+1], b2 = data[offset+2], b3 = data[offset+3], b4=data[offset+4];
			var vs = 1;
			var op=null, val=null;
			// operand
			if(b0<=20) { op = b0;  vs=1;  }
			if(b0==12) { op = b0*100+b1;  vs=2;  }
			if(b0==19 || b0==20) { op = b0/*+" "+b1*/;  vs=2; }
			if(21 <=b0 && b0<= 27) { op = b0;  vs=1; }
			if(b0==28) { val = bin.readShort(data,offset+1);  vs=3; }
			if(29 <=b0 && b0<= 31) { op = b0;  vs=1; }
			if(32 <=b0 && b0<=246) { val = b0-139;  vs=1; }
			if(247<=b0 && b0<=250) { val = (b0-247)*256+b1+108;  vs=2; }
			if(251<=b0 && b0<=254) { val =-(b0-251)*256-b1-108;  vs=2; }
			if(b0==255) {  val = bin.readInt(data, offset+1)/0xffff;  vs=5;   }

			arr.push(val!=null ? val : "o"+op);
			offset += vs;

			//var cv = arr[arr.length-1];
			//if(cv==undefined) throw "error";
			//console.log()
		}
		return arr;
	};

	Typr.CFF.readDict = function(data, offset, end)
	{
		var bin = Typr._bin;
		//var dict = [];
		var dict = {};
		var carr = [];

		while(offset<end)
		{
			var b0 = data[offset], b1 = data[offset+1], b2 = data[offset+2], b3 = data[offset+3], b4=data[offset+4];
			var vs = 1;
			var key=null, val=null;
			// operand
			if(b0==28) { val = bin.readShort(data,offset+1);  vs=3; }
			if(b0==29) { val = bin.readInt  (data,offset+1);  vs=5; }
			if(32 <=b0 && b0<=246) { val = b0-139;  vs=1; }
			if(247<=b0 && b0<=250) { val = (b0-247)*256+b1+108;  vs=2; }
			if(251<=b0 && b0<=254) { val =-(b0-251)*256-b1-108;  vs=2; }
			if(b0==255) {  val = bin.readInt(data, offset+1)/0xffff;  vs=5;  throw "unknown number";  }

			if(b0==30)
			{
				var nibs = [];
				vs = 1;
				while(true)
				{
					var b = data[offset+vs];  vs++;
					var nib0 = b>>4, nib1 = b&0xf;
					if(nib0 != 0xf) nibs.push(nib0);  if(nib1!=0xf) nibs.push(nib1);
					if(nib1==0xf) break;
				}
				var s = "";
				var chars = [0,1,2,3,4,5,6,7,8,9,".","e","e-","reserved","-","endOfNumber"];
				for(var i=0; i<nibs.length; i++) s += chars[nibs[i]];
				//console.log(nibs);
				val = parseFloat(s);
			}

			if(b0<=21)	// operator
			{
				var keys = ["version", "Notice", "FullName", "FamilyName", "Weight", "FontBBox", "BlueValues", "OtherBlues", "FamilyBlues","FamilyOtherBlues",
					"StdHW", "StdVW", "escape", "UniqueID", "XUID", "charset", "Encoding", "CharStrings", "Private", "Subrs",
					"defaultWidthX", "nominalWidthX"];

				key = keys[b0];  vs=1;
				if(b0==12) {
					var keys = [ "Copyright", "isFixedPitch", "ItalicAngle", "UnderlinePosition", "UnderlineThickness", "PaintType", "CharstringType", "FontMatrix", "StrokeWidth", "BlueScale",
					"BlueShift", "BlueFuzz", "StemSnapH", "StemSnapV", "ForceBold", 0,0, "LanguageGroup", "ExpansionFactor", "initialRandomSeed",
					"SyntheticBase", "PostScript", "BaseFontName", "BaseFontBlend", 0,0,0,0,0,0,
					"ROS", "CIDFontVersion", "CIDFontRevision", "CIDFontType", "CIDCount", "UIDBase", "FDArray", "FDSelect", "FontName"];
					key = keys[b1];  vs=2;
				}
			}

			if(key!=null) {  dict[key] = carr.length==1 ? carr[0] : carr;  carr=[]; }
			else  carr.push(val);

			offset += vs;
		}
		return dict;
	};


Typr.cmap = {};
Typr.cmap.parse = function(data, offset, length)
{
	data = new Uint8Array(data.buffer, offset, length);
	offset = 0;
	var bin = Typr._bin;
	var obj = {};
	var version   = bin.readUshort(data, offset);  offset += 2;
	var numTables = bin.readUshort(data, offset);  offset += 2;

	//console.log(version, numTables);

	var offs = [];
	obj.tables = [];


	for(var i=0; i<numTables; i++)
	{
		var platformID = bin.readUshort(data, offset);  offset += 2;
		var encodingID = bin.readUshort(data, offset);  offset += 2;
		var noffset = bin.readUint(data, offset);       offset += 4;

		var id = "p"+platformID+"e"+encodingID;

		//console.log("cmap subtable", platformID, encodingID, noffset);


		var tind = offs.indexOf(noffset);

		if(tind==-1)
		{
			tind = obj.tables.length;
			var subt;
			offs.push(noffset);
			var format = bin.readUshort(data, noffset);
			if     (format== 0) subt = Typr.cmap.parse0(data, noffset);
			else if(format== 4) subt = Typr.cmap.parse4(data, noffset);
			else if(format== 6) subt = Typr.cmap.parse6(data, noffset);
			else if(format==12) subt = Typr.cmap.parse12(data,noffset);
			else console.log("unknown format: "+format, platformID, encodingID, noffset);
			obj.tables.push(subt);
		}

		if(obj[id]!=null) throw "multiple tables for one platform+encoding";
		obj[id] = tind;
	}
	return obj;
};

Typr.cmap.parse0 = function(data, offset)
{
	var bin = Typr._bin;
	var obj = {};
	obj.format = bin.readUshort(data, offset);  offset += 2;
	var len    = bin.readUshort(data, offset);  offset += 2;
	var lang   = bin.readUshort(data, offset);  offset += 2;
	obj.map = [];
	for(var i=0; i<len-6; i++) obj.map.push(data[offset+i]);
	return obj;
};

Typr.cmap.parse4 = function(data, offset)
{
	var bin = Typr._bin;
	var offset0 = offset;
	var obj = {};

	obj.format = bin.readUshort(data, offset);  offset+=2;
	var length = bin.readUshort(data, offset);  offset+=2;
	var language = bin.readUshort(data, offset);  offset+=2;
	var segCountX2 = bin.readUshort(data, offset);  offset+=2;
	var segCount = segCountX2/2;
	obj.searchRange = bin.readUshort(data, offset);  offset+=2;
	obj.entrySelector = bin.readUshort(data, offset);  offset+=2;
	obj.rangeShift = bin.readUshort(data, offset);  offset+=2;
	obj.endCount   = bin.readUshorts(data, offset, segCount);  offset += segCount*2;
	offset+=2;
	obj.startCount = bin.readUshorts(data, offset, segCount);  offset += segCount*2;
	obj.idDelta = [];
	for(var i=0; i<segCount; i++) {obj.idDelta.push(bin.readShort(data, offset));  offset+=2;}
	obj.idRangeOffset = bin.readUshorts(data, offset, segCount);  offset += segCount*2;
	obj.glyphIdArray = [];
	while(offset< offset0+length) {obj.glyphIdArray.push(bin.readUshort(data, offset));  offset+=2;}
	return obj;
};

Typr.cmap.parse6 = function(data, offset)
{
	var bin = Typr._bin;
	var obj = {};

	obj.format = bin.readUshort(data, offset);  offset+=2;
	var length = bin.readUshort(data, offset);  offset+=2;
	var language = bin.readUshort(data, offset);  offset+=2;
	obj.firstCode = bin.readUshort(data, offset);  offset+=2;
	var entryCount = bin.readUshort(data, offset);  offset+=2;
	obj.glyphIdArray = [];
	for(var i=0; i<entryCount; i++) {obj.glyphIdArray.push(bin.readUshort(data, offset));  offset+=2;}

	return obj;
};

Typr.cmap.parse12 = function(data, offset)
{
	var bin = Typr._bin;
	var obj = {};

	obj.format = bin.readUshort(data, offset);  offset+=2;
	offset += 2;
	var length = bin.readUint(data, offset);  offset+=4;
	var lang   = bin.readUint(data, offset);  offset+=4;
	var nGroups= bin.readUint(data, offset);  offset+=4;
	obj.groups = [];

	for(var i=0; i<nGroups; i++)
	{
		var off = offset + i * 12;
		var startCharCode = bin.readUint(data, off+0);
		var endCharCode   = bin.readUint(data, off+4);
		var startGlyphID  = bin.readUint(data, off+8);
		obj.groups.push([  startCharCode, endCharCode, startGlyphID  ]);
	}
	return obj;
};

Typr.glyf = {};
Typr.glyf.parse = function(data, offset, length, font)
{
	var obj = [];
	for(var g=0; g<font.maxp.numGlyphs; g++) obj.push(null);
	return obj;
};

Typr.glyf._parseGlyf = function(font, g)
{
	var bin = Typr._bin;
	var data = font._data;

	var offset = Typr._tabOffset(data, "glyf", font._offset) + font.loca[g];

	if(font.loca[g]==font.loca[g+1]) return null;

	var gl = {};

	gl.noc  = bin.readShort(data, offset);  offset+=2;		// number of contours
	gl.xMin = bin.readShort(data, offset);  offset+=2;
	gl.yMin = bin.readShort(data, offset);  offset+=2;
	gl.xMax = bin.readShort(data, offset);  offset+=2;
	gl.yMax = bin.readShort(data, offset);  offset+=2;

	if(gl.xMin>=gl.xMax || gl.yMin>=gl.yMax) return null;

	if(gl.noc>0)
	{
		gl.endPts = [];
		for(var i=0; i<gl.noc; i++) { gl.endPts.push(bin.readUshort(data,offset)); offset+=2; }

		var instructionLength = bin.readUshort(data,offset); offset+=2;
		if((data.length-offset)<instructionLength) return null;
		gl.instructions = bin.readBytes(data, offset, instructionLength);   offset+=instructionLength;

		var crdnum = gl.endPts[gl.noc-1]+1;
		gl.flags = [];
		for(var i=0; i<crdnum; i++ )
		{
			var flag = data[offset];  offset++;
			gl.flags.push(flag);
			if((flag&8)!=0)
			{
				var rep = data[offset];  offset++;
				for(var j=0; j<rep; j++) { gl.flags.push(flag); i++; }
			}
		}
		gl.xs = [];
		for(var i=0; i<crdnum; i++) {
			var i8=((gl.flags[i]&2)!=0), same=((gl.flags[i]&16)!=0);
			if(i8) { gl.xs.push(same ? data[offset] : -data[offset]);  offset++; }
			else
			{
				if(same) gl.xs.push(0);
				else { gl.xs.push(bin.readShort(data, offset));  offset+=2; }
			}
		}
		gl.ys = [];
		for(var i=0; i<crdnum; i++) {
			var i8=((gl.flags[i]&4)!=0), same=((gl.flags[i]&32)!=0);
			if(i8) { gl.ys.push(same ? data[offset] : -data[offset]);  offset++; }
			else
			{
				if(same) gl.ys.push(0);
				else { gl.ys.push(bin.readShort(data, offset));  offset+=2; }
			}
		}
		var x = 0, y = 0;
		for(var i=0; i<crdnum; i++) { x += gl.xs[i]; y += gl.ys[i];  gl.xs[i]=x;  gl.ys[i]=y; }
		//console.log(endPtsOfContours, instructionLength, instructions, flags, xCoordinates, yCoordinates);
	}
	else
	{
		var ARG_1_AND_2_ARE_WORDS	= 1<<0;
		var ARGS_ARE_XY_VALUES		= 1<<1;
		var WE_HAVE_A_SCALE			= 1<<3;
		var MORE_COMPONENTS			= 1<<5;
		var WE_HAVE_AN_X_AND_Y_SCALE= 1<<6;
		var WE_HAVE_A_TWO_BY_TWO	= 1<<7;
		var WE_HAVE_INSTRUCTIONS	= 1<<8;

		gl.parts = [];
		var flags;
		do {
			flags = bin.readUshort(data, offset);  offset += 2;
			var part = { m:{a:1,b:0,c:0,d:1,tx:0,ty:0}, p1:-1, p2:-1 };  gl.parts.push(part);
			part.glyphIndex = bin.readUshort(data, offset);  offset += 2;
			if ( flags & ARG_1_AND_2_ARE_WORDS) {
				var arg1 = bin.readShort(data, offset);  offset += 2;
				var arg2 = bin.readShort(data, offset);  offset += 2;
			} else {
				var arg1 = bin.readInt8(data, offset);  offset ++;
				var arg2 = bin.readInt8(data, offset);  offset ++;
			}

			if(flags & ARGS_ARE_XY_VALUES) { part.m.tx = arg1;  part.m.ty = arg2; }
			else  {  part.p1=arg1;  part.p2=arg2;  }
			//part.m.tx = arg1;  part.m.ty = arg2;
			//else { throw "params are not XY values"; }

			if ( flags & WE_HAVE_A_SCALE ) {
				part.m.a = part.m.d = bin.readF2dot14(data, offset);  offset += 2;
			} else if ( flags & WE_HAVE_AN_X_AND_Y_SCALE ) {
				part.m.a = bin.readF2dot14(data, offset);  offset += 2;
				part.m.d = bin.readF2dot14(data, offset);  offset += 2;
			} else if ( flags & WE_HAVE_A_TWO_BY_TWO ) {
				part.m.a = bin.readF2dot14(data, offset);  offset += 2;
				part.m.b = bin.readF2dot14(data, offset);  offset += 2;
				part.m.c = bin.readF2dot14(data, offset);  offset += 2;
				part.m.d = bin.readF2dot14(data, offset);  offset += 2;
			}
		} while ( flags & MORE_COMPONENTS )
		if (flags & WE_HAVE_INSTRUCTIONS){
			var numInstr = bin.readUshort(data, offset);  offset += 2;
			gl.instr = [];
			for(var i=0; i<numInstr; i++) { gl.instr.push(data[offset]);  offset++; }
		}
	}
	return gl;
};


Typr.GPOS = {};
Typr.GPOS.parse = function(data, offset, length, font) {  return Typr._lctf.parse(data, offset, length, font, Typr.GPOS.subt);  };


Typr.GPOS.subt = function(data, ltype, offset)	// lookup type
{
	var bin = Typr._bin, offset0 = offset, tab = {};

	tab.fmt  = bin.readUshort(data, offset);  offset+=2;

	//console.log(ltype, tab.fmt);

	if(ltype==1 || ltype==2 || ltype==3 || ltype==7 || (ltype==8 && tab.fmt<=2)) {
		var covOff  = bin.readUshort(data, offset);  offset+=2;
		tab.coverage = Typr._lctf.readCoverage(data, covOff+offset0);
	}
	if(ltype==1 && tab.fmt==1) {
		var valFmt1 = bin.readUshort(data, offset);  offset+=2;
		var ones1 = Typr._lctf.numOfOnes(valFmt1);
		if(valFmt1!=0)  tab.pos = Typr.GPOS.readValueRecord(data, offset, valFmt1);
	}
	else if(ltype==2) {
		var valFmt1 = bin.readUshort(data, offset);  offset+=2;
		var valFmt2 = bin.readUshort(data, offset);  offset+=2;
		var ones1 = Typr._lctf.numOfOnes(valFmt1);
		var ones2 = Typr._lctf.numOfOnes(valFmt2);
		if(tab.fmt==1)
		{
			tab.pairsets = [];
			var psc = bin.readUshort(data, offset);  offset+=2;  // PairSetCount

			for(var i=0; i<psc; i++)
			{
				var psoff = offset0 + bin.readUshort(data, offset);  offset+=2;

				var pvc = bin.readUshort(data, psoff);  psoff+=2;
				var arr = [];
				for(var j=0; j<pvc; j++)
				{
					var gid2 = bin.readUshort(data, psoff);  psoff+=2;
					var value1, value2;
					if(valFmt1!=0) {  value1 = Typr.GPOS.readValueRecord(data, psoff, valFmt1);  psoff+=ones1*2;  }
					if(valFmt2!=0) {  value2 = Typr.GPOS.readValueRecord(data, psoff, valFmt2);  psoff+=ones2*2;  }
					//if(value1!=null) throw "e";
					arr.push({gid2:gid2, val1:value1, val2:value2});
				}
				tab.pairsets.push(arr);
			}
		}
		if(tab.fmt==2)
		{
			var classDef1 = bin.readUshort(data, offset);  offset+=2;
			var classDef2 = bin.readUshort(data, offset);  offset+=2;
			var class1Count = bin.readUshort(data, offset);  offset+=2;
			var class2Count = bin.readUshort(data, offset);  offset+=2;

			tab.classDef1 = Typr._lctf.readClassDef(data, offset0 + classDef1);
			tab.classDef2 = Typr._lctf.readClassDef(data, offset0 + classDef2);

			tab.matrix = [];
			for(var i=0; i<class1Count; i++)
			{
				var row = [];
				for(var j=0; j<class2Count; j++)
				{
					var value1 = null, value2 = null;
					if(tab.valFmt1!=0) { value1 = Typr.GPOS.readValueRecord(data, offset, tab.valFmt1);  offset+=ones1*2; }
					if(tab.valFmt2!=0) { value2 = Typr.GPOS.readValueRecord(data, offset, tab.valFmt2);  offset+=ones2*2; }
					row.push({val1:value1, val2:value2});
				}
				tab.matrix.push(row);
			}
		}
	}
	return tab;
};


Typr.GPOS.readValueRecord = function(data, offset, valFmt)
{
	var bin = Typr._bin;
	var arr = [];
	arr.push( (valFmt&1) ? bin.readShort(data, offset) : 0 );  offset += (valFmt&1) ? 2 : 0;  // X_PLACEMENT
	arr.push( (valFmt&2) ? bin.readShort(data, offset) : 0 );  offset += (valFmt&2) ? 2 : 0;  // Y_PLACEMENT
	arr.push( (valFmt&4) ? bin.readShort(data, offset) : 0 );  offset += (valFmt&4) ? 2 : 0;  // X_ADVANCE
	arr.push( (valFmt&8) ? bin.readShort(data, offset) : 0 );  offset += (valFmt&8) ? 2 : 0;  // Y_ADVANCE
	return arr;
};

Typr.GSUB = {};
Typr.GSUB.parse = function(data, offset, length, font) {  return Typr._lctf.parse(data, offset, length, font, Typr.GSUB.subt);  };


Typr.GSUB.subt = function(data, ltype, offset)	// lookup type
{
	var bin = Typr._bin, offset0 = offset, tab = {};

	tab.fmt  = bin.readUshort(data, offset);  offset+=2;

	if(ltype!=1 && ltype!=4 && ltype!=5 && ltype!=6) return null;

	if(ltype==1 || ltype==4 || (ltype==5 && tab.fmt<=2) || (ltype==6 && tab.fmt<=2)) {
		var covOff  = bin.readUshort(data, offset);  offset+=2;
		tab.coverage = Typr._lctf.readCoverage(data, offset0+covOff);	// not always is coverage here
	}

	if(ltype==1) {
		if(tab.fmt==1) {
			tab.delta = bin.readShort(data, offset);  offset+=2;
		}
		else if(tab.fmt==2) {
			var cnt = bin.readUshort(data, offset);  offset+=2;
			tab.newg = bin.readUshorts(data, offset, cnt);  offset+=tab.newg.length*2;
		}
	}
	//  Ligature Substitution Subtable
	else if(ltype==4) {
		tab.vals = [];
		var cnt = bin.readUshort(data, offset);  offset+=2;
		for(var i=0; i<cnt; i++) {
			var loff = bin.readUshort(data, offset);  offset+=2;
			tab.vals.push(Typr.GSUB.readLigatureSet(data, offset0+loff));
		}
		//console.log(tab.coverage);
		//console.log(tab.vals);
	}
	//  Contextual Substitution Subtable
	else if(ltype==5) {
		if(tab.fmt==2) {
			var cDefOffset = bin.readUshort(data, offset);  offset+=2;
			tab.cDef = Typr._lctf.readClassDef(data, offset0 + cDefOffset);
			tab.scset = [];
			var subClassSetCount = bin.readUshort(data, offset);  offset+=2;
			for(var i=0; i<subClassSetCount; i++)
			{
				var scsOff = bin.readUshort(data, offset);  offset+=2;
				tab.scset.push(  scsOff==0 ? null : Typr.GSUB.readSubClassSet(data, offset0 + scsOff)  );
			}
		}
		//else console.log("unknown table format", tab.fmt);
	}
	//*
	else if(ltype==6) {
		/*
		if(tab.fmt==2) {
			var btDef = bin.readUshort(data, offset);  offset+=2;
			var inDef = bin.readUshort(data, offset);  offset+=2;
			var laDef = bin.readUshort(data, offset);  offset+=2;

			tab.btDef = Typr._lctf.readClassDef(data, offset0 + btDef);
			tab.inDef = Typr._lctf.readClassDef(data, offset0 + inDef);
			tab.laDef = Typr._lctf.readClassDef(data, offset0 + laDef);

			tab.scset = [];
			var cnt = bin.readUshort(data, offset);  offset+=2;
			for(var i=0; i<cnt; i++) {
				var loff = bin.readUshort(data, offset);  offset+=2;
				tab.scset.push(Typr.GSUB.readChainSubClassSet(data, offset0+loff));
			}
		}
		*/
		if(tab.fmt==3) {
			for(var i=0; i<3; i++) {
				var cnt = bin.readUshort(data, offset);  offset+=2;
				var cvgs = [];
				for(var j=0; j<cnt; j++) cvgs.push(  Typr._lctf.readCoverage(data, offset0 + bin.readUshort(data, offset+j*2))   );
				offset+=cnt*2;
				if(i==0) tab.backCvg = cvgs;
				if(i==1) tab.inptCvg = cvgs;
				if(i==2) tab.ahedCvg = cvgs;
			}
			var cnt = bin.readUshort(data, offset);  offset+=2;
			tab.lookupRec = Typr.GSUB.readSubstLookupRecords(data, offset, cnt);
		}
		//console.log(tab);
	} //*/
	//if(tab.coverage.indexOf(3)!=-1) console.log(ltype, fmt, tab);

	return tab;
};

Typr.GSUB.readSubClassSet = function(data, offset)
{
	var rUs = Typr._bin.readUshort, offset0 = offset, lset = [];
	var cnt = rUs(data, offset);  offset+=2;
	for(var i=0; i<cnt; i++) {
		var loff = rUs(data, offset);  offset+=2;
		lset.push(Typr.GSUB.readSubClassRule(data, offset0+loff));
	}
	return lset;
};
Typr.GSUB.readSubClassRule= function(data, offset)
{
	var rUs = Typr._bin.readUshort, rule = {};
	var gcount = rUs(data, offset);  offset+=2;
	var scount = rUs(data, offset);  offset+=2;
	rule.input = [];
	for(var i=0; i<gcount-1; i++) {
		rule.input.push(rUs(data, offset));  offset+=2;
	}
	rule.substLookupRecords = Typr.GSUB.readSubstLookupRecords(data, offset, scount);
	return rule;
};
Typr.GSUB.readSubstLookupRecords = function(data, offset, cnt)
{
	var rUs = Typr._bin.readUshort;
	var out = [];
	for(var i=0; i<cnt; i++) {  out.push(rUs(data, offset), rUs(data, offset+2));  offset+=4;  }
	return out;
};

Typr.GSUB.readChainSubClassSet = function(data, offset)
{
	var bin = Typr._bin, offset0 = offset, lset = [];
	var cnt = bin.readUshort(data, offset);  offset+=2;
	for(var i=0; i<cnt; i++) {
		var loff = bin.readUshort(data, offset);  offset+=2;
		lset.push(Typr.GSUB.readChainSubClassRule(data, offset0+loff));
	}
	return lset;
};
Typr.GSUB.readChainSubClassRule= function(data, offset)
{
	var bin = Typr._bin, rule = {};
	var pps = ["backtrack", "input", "lookahead"];
	for(var pi=0; pi<pps.length; pi++) {
		var cnt = bin.readUshort(data, offset);  offset+=2;  if(pi==1) cnt--;
		rule[pps[pi]]=bin.readUshorts(data, offset, cnt);  offset+= rule[pps[pi]].length*2;
	}
	var cnt = bin.readUshort(data, offset);  offset+=2;
	rule.subst = bin.readUshorts(data, offset, cnt*2);  offset += rule.subst.length*2;
	return rule;
};

Typr.GSUB.readLigatureSet = function(data, offset)
{
	var bin = Typr._bin, offset0 = offset, lset = [];
	var lcnt = bin.readUshort(data, offset);  offset+=2;
	for(var j=0; j<lcnt; j++) {
		var loff = bin.readUshort(data, offset);  offset+=2;
		lset.push(Typr.GSUB.readLigature(data, offset0+loff));
	}
	return lset;
};
Typr.GSUB.readLigature = function(data, offset)
{
	var bin = Typr._bin, lig = {chain:[]};
	lig.nglyph = bin.readUshort(data, offset);  offset+=2;
	var ccnt = bin.readUshort(data, offset);  offset+=2;
	for(var k=0; k<ccnt-1; k++) {  lig.chain.push(bin.readUshort(data, offset));  offset+=2;  }
	return lig;
};



Typr.head = {};
Typr.head.parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var obj = {};
	var tableVersion = bin.readFixed(data, offset);  offset += 4;
	obj.fontRevision = bin.readFixed(data, offset);  offset += 4;
	var checkSumAdjustment = bin.readUint(data, offset);  offset += 4;
	var magicNumber = bin.readUint(data, offset);  offset += 4;
	obj.flags = bin.readUshort(data, offset);  offset += 2;
	obj.unitsPerEm = bin.readUshort(data, offset);  offset += 2;
	obj.created  = bin.readUint64(data, offset);  offset += 8;
	obj.modified = bin.readUint64(data, offset);  offset += 8;
	obj.xMin = bin.readShort(data, offset);  offset += 2;
	obj.yMin = bin.readShort(data, offset);  offset += 2;
	obj.xMax = bin.readShort(data, offset);  offset += 2;
	obj.yMax = bin.readShort(data, offset);  offset += 2;
	obj.macStyle = bin.readUshort(data, offset);  offset += 2;
	obj.lowestRecPPEM = bin.readUshort(data, offset);  offset += 2;
	obj.fontDirectionHint = bin.readShort(data, offset);  offset += 2;
	obj.indexToLocFormat  = bin.readShort(data, offset);  offset += 2;
	obj.glyphDataFormat   = bin.readShort(data, offset);  offset += 2;
	return obj;
};


Typr.hhea = {};
Typr.hhea.parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var obj = {};
	var tableVersion = bin.readFixed(data, offset);  offset += 4;
	obj.ascender  = bin.readShort(data, offset);  offset += 2;
	obj.descender = bin.readShort(data, offset);  offset += 2;
	obj.lineGap = bin.readShort(data, offset);  offset += 2;

	obj.advanceWidthMax = bin.readUshort(data, offset);  offset += 2;
	obj.minLeftSideBearing  = bin.readShort(data, offset);  offset += 2;
	obj.minRightSideBearing = bin.readShort(data, offset);  offset += 2;
	obj.xMaxExtent = bin.readShort(data, offset);  offset += 2;

	obj.caretSlopeRise = bin.readShort(data, offset);  offset += 2;
	obj.caretSlopeRun  = bin.readShort(data, offset);  offset += 2;
	obj.caretOffset    = bin.readShort(data, offset);  offset += 2;

	offset += 4*2;

	obj.metricDataFormat = bin.readShort (data, offset);  offset += 2;
	obj.numberOfHMetrics = bin.readUshort(data, offset);  offset += 2;
	return obj;
};


Typr.hmtx = {};
Typr.hmtx.parse = function(data, offset, length, font)
{
	var bin = Typr._bin;
	var obj = {};

	obj.aWidth = [];
	obj.lsBearing = [];


	var aw = 0, lsb = 0;

	for(var i=0; i<font.maxp.numGlyphs; i++)
	{
		if(i<font.hhea.numberOfHMetrics) {  aw=bin.readUshort(data, offset);  offset += 2;  lsb=bin.readShort(data, offset);  offset+=2;  }
		obj.aWidth.push(aw);
		obj.lsBearing.push(lsb);
	}

	return obj;
};


Typr.kern = {};
Typr.kern.parse = function(data, offset, length, font)
{
	var bin = Typr._bin;

	var version = bin.readUshort(data, offset);  offset+=2;
	if(version==1) return Typr.kern.parseV1(data, offset-2, length, font);
	var nTables = bin.readUshort(data, offset);  offset+=2;

	var map = {glyph1: [], rval:[]};
	for(var i=0; i<nTables; i++)
	{
		offset+=2;	// skip version
		var length  = bin.readUshort(data, offset);  offset+=2;
		var coverage = bin.readUshort(data, offset);  offset+=2;
		var format = coverage>>>8;
		/* I have seen format 128 once, that's why I do */ format &= 0xf;
		if(format==0) offset = Typr.kern.readFormat0(data, offset, map);
		else throw "unknown kern table format: "+format;
	}
	return map;
};

Typr.kern.parseV1 = function(data, offset, length, font)
{
	var bin = Typr._bin;

	var version = bin.readFixed(data, offset);  offset+=4;
	var nTables = bin.readUint(data, offset);  offset+=4;

	var map = {glyph1: [], rval:[]};
	for(var i=0; i<nTables; i++)
	{
		var length = bin.readUint(data, offset);   offset+=4;
		var coverage = bin.readUshort(data, offset);  offset+=2;
		var tupleIndex = bin.readUshort(data, offset);  offset+=2;
		var format = coverage>>>8;
		/* I have seen format 128 once, that's why I do */ format &= 0xf;
		if(format==0) offset = Typr.kern.readFormat0(data, offset, map);
		else throw "unknown kern table format: "+format;
	}
	return map;
};

Typr.kern.readFormat0 = function(data, offset, map)
{
	var bin = Typr._bin;
	var pleft = -1;
	var nPairs        = bin.readUshort(data, offset);  offset+=2;
	var searchRange   = bin.readUshort(data, offset);  offset+=2;
	var entrySelector = bin.readUshort(data, offset);  offset+=2;
	var rangeShift    = bin.readUshort(data, offset);  offset+=2;
	for(var j=0; j<nPairs; j++)
	{
		var left  = bin.readUshort(data, offset);  offset+=2;
		var right = bin.readUshort(data, offset);  offset+=2;
		var value = bin.readShort (data, offset);  offset+=2;
		if(left!=pleft) { map.glyph1.push(left);  map.rval.push({ glyph2:[], vals:[] }); }
		var rval = map.rval[map.rval.length-1];
		rval.glyph2.push(right);   rval.vals.push(value);
		pleft = left;
	}
	return offset;
};



Typr.loca = {};
Typr.loca.parse = function(data, offset, length, font)
{
	var bin = Typr._bin;
	var obj = [];

	var ver = font.head.indexToLocFormat;
	//console.log("loca", ver, length, 4*font.maxp.numGlyphs);
	var len = font.maxp.numGlyphs+1;

	if(ver==0) for(var i=0; i<len; i++) obj.push(bin.readUshort(data, offset+(i<<1))<<1);
	if(ver==1) for(var i=0; i<len; i++) obj.push(bin.readUint  (data, offset+(i<<2))   );

	return obj;
};


Typr.maxp = {};
Typr.maxp.parse = function(data, offset, length)
{
	//console.log(data.length, offset, length);

	var bin = Typr._bin;
	var obj = {};

	// both versions 0.5 and 1.0
	var ver = bin.readUint(data, offset); offset += 4;
	obj.numGlyphs = bin.readUshort(data, offset);  offset += 2;

	// only 1.0
	if(ver == 0x00010000)
	{
		obj.maxPoints             = bin.readUshort(data, offset);  offset += 2;
		obj.maxContours           = bin.readUshort(data, offset);  offset += 2;
		obj.maxCompositePoints    = bin.readUshort(data, offset);  offset += 2;
		obj.maxCompositeContours  = bin.readUshort(data, offset);  offset += 2;
		obj.maxZones              = bin.readUshort(data, offset);  offset += 2;
		obj.maxTwilightPoints     = bin.readUshort(data, offset);  offset += 2;
		obj.maxStorage            = bin.readUshort(data, offset);  offset += 2;
		obj.maxFunctionDefs       = bin.readUshort(data, offset);  offset += 2;
		obj.maxInstructionDefs    = bin.readUshort(data, offset);  offset += 2;
		obj.maxStackElements      = bin.readUshort(data, offset);  offset += 2;
		obj.maxSizeOfInstructions = bin.readUshort(data, offset);  offset += 2;
		obj.maxComponentElements  = bin.readUshort(data, offset);  offset += 2;
		obj.maxComponentDepth     = bin.readUshort(data, offset);  offset += 2;
	}

	return obj;
};


Typr.name = {};
Typr.name.parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var obj = {};
	var format = bin.readUshort(data, offset);  offset += 2;
	var count  = bin.readUshort(data, offset);  offset += 2;
	var stringOffset = bin.readUshort(data, offset);  offset += 2;

	//console.log(format,count);

	var names = [
		"copyright",
		"fontFamily",
		"fontSubfamily",
		"ID",
		"fullName",
		"version",
		"postScriptName",
		"trademark",
		"manufacturer",
		"designer",
		"description",
		"urlVendor",
		"urlDesigner",
		"licence",
		"licenceURL",
		"---",
		"typoFamilyName",
		"typoSubfamilyName",
		"compatibleFull",
		"sampleText",
		"postScriptCID",
		"wwsFamilyName",
		"wwsSubfamilyName",
		"lightPalette",
		"darkPalette"
	];

	var offset0 = offset;

	for(var i=0; i<count; i++)
	{
		var platformID = bin.readUshort(data, offset);  offset += 2;
		var encodingID = bin.readUshort(data, offset);  offset += 2;
		var languageID = bin.readUshort(data, offset);  offset += 2;
		var nameID     = bin.readUshort(data, offset);  offset += 2;
		var slen       = bin.readUshort(data, offset);  offset += 2;
		var noffset    = bin.readUshort(data, offset);  offset += 2;
		//console.log(platformID, encodingID, languageID.toString(16), nameID, length, noffset);

		var cname = names[nameID];
		var soff = offset0 + count*12 + noffset;
		var str;
		if(platformID == 0) str = bin.readUnicode(data, soff, slen/2);
		else if(platformID == 3 && encodingID == 0) str = bin.readUnicode(data, soff, slen/2);
		else if(encodingID == 0) str = bin.readASCII  (data, soff, slen);
		else if(encodingID == 1) str = bin.readUnicode(data, soff, slen/2);
		else if(encodingID == 3) str = bin.readUnicode(data, soff, slen/2);

		else if(platformID == 1) { str = bin.readASCII(data, soff, slen);  console.log("reading unknown MAC encoding "+encodingID+" as ASCII"); }
		else throw "unknown encoding "+encodingID + ", platformID: "+platformID;

		var tid = "p"+platformID+","+(languageID).toString(16);//Typr._platforms[platformID];
		if(obj[tid]==null) obj[tid] = {};
		obj[tid][cname] = str;
		obj[tid]._lang = languageID;
		//console.log(tid, obj[tid]);
	}
	/*
	if(format == 1)
	{
		var langTagCount = bin.readUshort(data, offset);  offset += 2;
		for(var i=0; i<langTagCount; i++)
		{
			var length  = bin.readUshort(data, offset);  offset += 2;
			var noffset = bin.readUshort(data, offset);  offset += 2;
		}
	}
	*/

	//console.log(obj);

	for(var p in obj) if(obj[p].postScriptName!=null && obj[p]._lang==0x0409) return obj[p];		// United States
	for(var p in obj) if(obj[p].postScriptName!=null && obj[p]._lang==0x0000) return obj[p];		// Universal
	for(var p in obj) if(obj[p].postScriptName!=null && obj[p]._lang==0x0c0c) return obj[p];		// Canada
	for(var p in obj) if(obj[p].postScriptName!=null) return obj[p];

	var tname;
	for(var p in obj) { tname=p; break; }
	console.log("returning name table with languageID "+ obj[tname]._lang);
	return obj[tname];
};


Typr["OS/2"] = {};
Typr["OS/2"].parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var ver = bin.readUshort(data, offset); offset += 2;

	var obj = {};
	if     (ver==0) Typr["OS/2"].version0(data, offset, obj);
	else if(ver==1) Typr["OS/2"].version1(data, offset, obj);
	else if(ver==2 || ver==3 || ver==4) Typr["OS/2"].version2(data, offset, obj);
	else if(ver==5) Typr["OS/2"].version5(data, offset, obj);
	else throw "unknown OS/2 table version: "+ver;

	return obj;
};

Typr["OS/2"].version0 = function(data, offset, obj)
{
	var bin = Typr._bin;
	obj.xAvgCharWidth = bin.readShort(data, offset); offset += 2;
	obj.usWeightClass = bin.readUshort(data, offset); offset += 2;
	obj.usWidthClass  = bin.readUshort(data, offset); offset += 2;
	obj.fsType = bin.readUshort(data, offset); offset += 2;
	obj.ySubscriptXSize = bin.readShort(data, offset); offset += 2;
	obj.ySubscriptYSize = bin.readShort(data, offset); offset += 2;
	obj.ySubscriptXOffset = bin.readShort(data, offset); offset += 2;
	obj.ySubscriptYOffset = bin.readShort(data, offset); offset += 2;
	obj.ySuperscriptXSize = bin.readShort(data, offset); offset += 2;
	obj.ySuperscriptYSize = bin.readShort(data, offset); offset += 2;
	obj.ySuperscriptXOffset = bin.readShort(data, offset); offset += 2;
	obj.ySuperscriptYOffset = bin.readShort(data, offset); offset += 2;
	obj.yStrikeoutSize = bin.readShort(data, offset); offset += 2;
	obj.yStrikeoutPosition = bin.readShort(data, offset); offset += 2;
	obj.sFamilyClass = bin.readShort(data, offset); offset += 2;
	obj.panose = bin.readBytes(data, offset, 10);  offset += 10;
	obj.ulUnicodeRange1	= bin.readUint(data, offset);  offset += 4;
	obj.ulUnicodeRange2	= bin.readUint(data, offset);  offset += 4;
	obj.ulUnicodeRange3	= bin.readUint(data, offset);  offset += 4;
	obj.ulUnicodeRange4	= bin.readUint(data, offset);  offset += 4;
	obj.achVendID = [bin.readInt8(data, offset), bin.readInt8(data, offset+1),bin.readInt8(data, offset+2),bin.readInt8(data, offset+3)];  offset += 4;
	obj.fsSelection	 = bin.readUshort(data, offset); offset += 2;
	obj.usFirstCharIndex = bin.readUshort(data, offset); offset += 2;
	obj.usLastCharIndex = bin.readUshort(data, offset); offset += 2;
	obj.sTypoAscender = bin.readShort(data, offset); offset += 2;
	obj.sTypoDescender = bin.readShort(data, offset); offset += 2;
	obj.sTypoLineGap = bin.readShort(data, offset); offset += 2;
	obj.usWinAscent = bin.readUshort(data, offset); offset += 2;
	obj.usWinDescent = bin.readUshort(data, offset); offset += 2;
	return offset;
};

Typr["OS/2"].version1 = function(data, offset, obj)
{
	var bin = Typr._bin;
	offset = Typr["OS/2"].version0(data, offset, obj);

	obj.ulCodePageRange1 = bin.readUint(data, offset); offset += 4;
	obj.ulCodePageRange2 = bin.readUint(data, offset); offset += 4;
	return offset;
};

Typr["OS/2"].version2 = function(data, offset, obj)
{
	var bin = Typr._bin;
	offset = Typr["OS/2"].version1(data, offset, obj);

	obj.sxHeight = bin.readShort(data, offset); offset += 2;
	obj.sCapHeight = bin.readShort(data, offset); offset += 2;
	obj.usDefault = bin.readUshort(data, offset); offset += 2;
	obj.usBreak = bin.readUshort(data, offset); offset += 2;
	obj.usMaxContext = bin.readUshort(data, offset); offset += 2;
	return offset;
};

Typr["OS/2"].version5 = function(data, offset, obj)
{
	var bin = Typr._bin;
	offset = Typr["OS/2"].version2(data, offset, obj);

	obj.usLowerOpticalPointSize = bin.readUshort(data, offset); offset += 2;
	obj.usUpperOpticalPointSize = bin.readUshort(data, offset); offset += 2;
	return offset;
};

Typr.post = {};
Typr.post.parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var obj = {};

	obj.version           = bin.readFixed(data, offset);  offset+=4;
	obj.italicAngle       = bin.readFixed(data, offset);  offset+=4;
	obj.underlinePosition = bin.readShort(data, offset);  offset+=2;
	obj.underlineThickness = bin.readShort(data, offset);  offset+=2;

	return obj;
};
Typr.SVG = {};
Typr.SVG.parse = function(data, offset, length)
{
	var bin = Typr._bin;
	var obj = { entries: []};

	var offset0 = offset;

	var tableVersion = bin.readUshort(data, offset);	offset += 2;
	var svgDocIndexOffset = bin.readUint(data, offset);	offset += 4;
	var reserved = bin.readUint(data, offset); offset += 4;

	offset = svgDocIndexOffset + offset0;

	var numEntries = bin.readUshort(data, offset);	offset += 2;

	for(var i=0; i<numEntries; i++)
	{
		var startGlyphID = bin.readUshort(data, offset);  offset += 2;
		var endGlyphID   = bin.readUshort(data, offset);  offset += 2;
		var svgDocOffset = bin.readUint  (data, offset);  offset += 4;
		var svgDocLength = bin.readUint  (data, offset);  offset += 4;

		var sbuf = new Uint8Array(data.buffer, offset0 + svgDocOffset + svgDocIndexOffset, svgDocLength);
		var svg = bin.readUTF8(sbuf, 0, sbuf.length);

		for(var f=startGlyphID; f<=endGlyphID; f++) {
			obj.entries[f] = svg;
		}
	}
	return obj;
};

Typr.SVG.toPath = function(str)
{
	var pth = {cmds:[], crds:[]};
	if(str==null) return pth;

	var prsr = new DOMParser();
	var doc = prsr["parseFromString"](str,"image/svg+xml");

	var svg = doc.firstChild;  while(svg.tagName!="svg") svg = svg.nextSibling;
	var vb = svg.getAttribute("viewBox");
	if(vb) vb = vb.trim().split(" ").map(parseFloat);  else   vb = [0,0,1000,1000];
	Typr.SVG._toPath(svg.children, pth);
	for(var i=0; i<pth.crds.length; i+=2) {
		var x = pth.crds[i], y = pth.crds[i+1];
		x -= vb[0];
		y -= vb[1];
		y = -y;
		pth.crds[i] = x;
		pth.crds[i+1] = y;
	}
	return pth;
};

Typr.SVG._toPath = function(nds, pth, fill) {
	for(var ni=0; ni<nds.length; ni++) {
		var nd = nds[ni], tn = nd.tagName;
		var cfl = nd.getAttribute("fill");  if(cfl==null) cfl = fill;
		if(tn=="g") Typr.SVG._toPath(nd.children, pth, cfl);
		else if(tn=="path") {
			pth.cmds.push(cfl?cfl:"#000000");
			var d = nd.getAttribute("d");  //console.log(d);
			var toks = Typr.SVG._tokens(d);  //console.log(toks);
			Typr.SVG._toksToPath(toks, pth);  pth.cmds.push("X");
		}
		else if(tn=="defs") ;
		else console.log(tn, nd);
	}
};

Typr.SVG._tokens = function(d) {
	var ts = [], off = 0, rn=false, cn="";  // reading number, current number
	while(off<d.length){
		var cc=d.charCodeAt(off), ch = d.charAt(off);  off++;
		var isNum = (48<=cc && cc<=57) || ch=="." || ch=="-";

		if(rn) {
			if(ch=="-") {  ts.push(parseFloat(cn));  cn=ch;  }
			else if(isNum) cn+=ch;
			else {  ts.push(parseFloat(cn));  if(ch!="," && ch!=" ") ts.push(ch);  rn=false;  }
		}
		else {
			if(isNum) {  cn=ch;  rn=true;  }
			else if(ch!="," && ch!=" ") ts.push(ch);
		}
	}
	if(rn) ts.push(parseFloat(cn));
	return ts;
};

Typr.SVG._toksToPath = function(ts, pth) {
	var i = 0, x = 0, y = 0, ox = 0, oy = 0;
	var pc = {"M":2,"L":2,"H":1,"V":1,   "S":4,   "C":6};
	var cmds = pth.cmds, crds = pth.crds;

	while(i<ts.length) {
		var cmd = ts[i];  i++;

		if(cmd=="z") {  cmds.push("Z");  x=ox;  y=oy;  }
		else {
			var cmu = cmd.toUpperCase();
			var ps = pc[cmu], reps = Typr.SVG._reps(ts, i, ps);

			for(var j=0; j<reps; j++) {
				var xi = 0, yi = 0;   if(cmd!=cmu) {  xi=x;  yi=y;  }

				if(cmu=="M") {  x = xi+ts[i++];  y = yi+ts[i++];  cmds.push("M");  crds.push(x,y);  ox=x;  oy=y; }
				else if(cmu=="L") {  x = xi+ts[i++];  y = yi+ts[i++];  cmds.push("L");  crds.push(x,y);  }
				else if(cmu=="H") {  x = xi+ts[i++];                   cmds.push("L");  crds.push(x,y);  }
				else if(cmu=="V") {  y = yi+ts[i++];                   cmds.push("L");  crds.push(x,y);  }
				else if(cmu=="C") {
					var x1=xi+ts[i++], y1=yi+ts[i++], x2=xi+ts[i++], y2=yi+ts[i++], x3=xi+ts[i++], y3=yi+ts[i++];
					cmds.push("C");  crds.push(x1,y1,x2,y2,x3,y3);  x=x3;  y=y3;
				}
				else if(cmu=="S") {
					var co = Math.max(crds.length-4, 0);
					var x1 = x+x-crds[co], y1 = y+y-crds[co+1];
					var x2=xi+ts[i++], y2=yi+ts[i++], x3=xi+ts[i++], y3=yi+ts[i++];
					cmds.push("C");  crds.push(x1,y1,x2,y2,x3,y3);  x=x3;  y=y3;
				}
				else console.log("Unknown SVG command "+cmd);
			}
		}
	}
};
Typr.SVG._reps = function(ts, off, ps) {
	var i = off;
	while(i<ts.length) {  if((typeof ts[i]) == "string") break;  i+=ps;  }
	return (i-off)/ps;
};
// End Typr.js

// Begin Typr.U.js

if(Typr  ==null) Typr   = {};
if(Typr.U==null) Typr.U = {};


Typr.U.codeToGlyph = function(font, code)
{
	var cmap = font.cmap;

	var tind = -1;
	if(cmap.p0e4!=null) tind = cmap.p0e4;
	else if(cmap.p3e1!=null) tind = cmap.p3e1;
	else if(cmap.p1e0!=null) tind = cmap.p1e0;
	else if(cmap.p0e3!=null) tind = cmap.p0e3;

	if(tind==-1) throw "no familiar platform and encoding!";

	var tab = cmap.tables[tind];

	if(tab.format==0)
	{
		if(code>=tab.map.length) return 0;
		return tab.map[code];
	}
	else if(tab.format==4)
	{
		var sind = -1;
		for(var i=0; i<tab.endCount.length; i++)   if(code<=tab.endCount[i]){  sind=i;  break;  }
		if(sind==-1) return 0;
		if(tab.startCount[sind]>code) return 0;

		var gli = 0;
		if(tab.idRangeOffset[sind]!=0) gli = tab.glyphIdArray[(code-tab.startCount[sind]) + (tab.idRangeOffset[sind]>>1) - (tab.idRangeOffset.length-sind)];
		else                           gli = code + tab.idDelta[sind];
		return gli & 0xFFFF;
	}
	else if(tab.format==12)
	{
		if(code>tab.groups[tab.groups.length-1][1]) return 0;
		for(var i=0; i<tab.groups.length; i++)
		{
			var grp = tab.groups[i];
			if(grp[0]<=code && code<=grp[1]) return grp[2] + (code-grp[0]);
		}
		return 0;
	}
	else throw "unknown cmap table format "+tab.format;
};


Typr.U.glyphToPath = function(font, gid)
{
	var path = { cmds:[], crds:[] };
	if(font.SVG && font.SVG.entries[gid]) {
		var p = font.SVG.entries[gid];  if(p==null) return path;
		if(typeof p == "string") {  p = Typr.SVG.toPath(p);  font.SVG.entries[gid]=p;  }
		return p;
	}
	else if(font.CFF) {
		var state = {x:0,y:0,stack:[],nStems:0,haveWidth:false,width: font.CFF.Private ? font.CFF.Private.defaultWidthX : 0,open:false};
		var cff=font.CFF, pdct = font.CFF.Private;
		if(cff.ROS) {
			var gi = 0;
			while(cff.FDSelect[gi+2]<=gid) gi+=2;
			pdct = cff.FDArray[cff.FDSelect[gi+1]].Private;
		}
		Typr.U._drawCFF(font.CFF.CharStrings[gid], state, cff, pdct, path);
	}
	else if(font.glyf) {  Typr.U._drawGlyf(gid, font, path);  }
	return path;
};

Typr.U._drawGlyf = function(gid, font, path)
{
	var gl = font.glyf[gid];
	if(gl==null) gl = font.glyf[gid] = Typr.glyf._parseGlyf(font, gid);
	if(gl!=null){
		if(gl.noc>-1) Typr.U._simpleGlyph(gl, path);
		else          Typr.U._compoGlyph (gl, font, path);
	}
};
Typr.U._simpleGlyph = function(gl, p)
{
	for(var c=0; c<gl.noc; c++)
	{
		var i0 = (c==0) ? 0 : (gl.endPts[c-1] + 1);
		var il = gl.endPts[c];

		for(var i=i0; i<=il; i++)
		{
			var pr = (i==i0)?il:(i-1);
			var nx = (i==il)?i0:(i+1);
			var onCurve = gl.flags[i]&1;
			var prOnCurve = gl.flags[pr]&1;
			var nxOnCurve = gl.flags[nx]&1;

			var x = gl.xs[i], y = gl.ys[i];

			if(i==i0) {
				if(onCurve)
				{
					if(prOnCurve) Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
					else          {  Typr.U.P.moveTo(p,x,y);  continue;  /*  will do curveTo at il  */  }
				}
				else
				{
					if(prOnCurve) Typr.U.P.moveTo(p,  gl.xs[pr],       gl.ys[pr]        );
					else          Typr.U.P.moveTo(p, (gl.xs[pr]+x)/2, (gl.ys[pr]+y)/2   );
				}
			}
			if(onCurve)
			{
				if(prOnCurve) Typr.U.P.lineTo(p,x,y);
			}
			else
			{
				if(nxOnCurve) Typr.U.P.qcurveTo(p, x, y, gl.xs[nx], gl.ys[nx]);
				else          Typr.U.P.qcurveTo(p, x, y, (x+gl.xs[nx])/2, (y+gl.ys[nx])/2);
			}
		}
		Typr.U.P.closePath(p);
	}
};
Typr.U._compoGlyph = function(gl, font, p)
{
	for(var j=0; j<gl.parts.length; j++)
	{
		var path = { cmds:[], crds:[] };
		var prt = gl.parts[j];
		Typr.U._drawGlyf(prt.glyphIndex, font, path);

		var m = prt.m;
		for(var i=0; i<path.crds.length; i+=2)
		{
			var x = path.crds[i  ], y = path.crds[i+1];
			p.crds.push(x*m.a + y*m.b + m.tx);
			p.crds.push(x*m.c + y*m.d + m.ty);
		}
		for(var i=0; i<path.cmds.length; i++) p.cmds.push(path.cmds[i]);
	}
};


Typr.U._getGlyphClass = function(g, cd)
{
	var intr = Typr._lctf.getInterval(cd, g);
	return intr==-1 ? 0 : cd[intr+2];
	//for(var i=0; i<cd.start.length; i++)
	//	if(cd.start[i]<=g && cd.end[i]>=g) return cd.class[i];
	//return 0;
};

Typr.U.getPairAdjustment = function(font, g1, g2)
{
	//return 0;
	if(font.GPOS) {
		var gpos = font["GPOS"];
		var llist = gpos.lookupList, flist = gpos.featureList;
		var tused = [];
		for(var i=0; i<flist.length; i++)
		{
			var fl = flist[i];  //console.log(fl);
			if(fl.tag!="kern") continue;
			for(var ti=0; ti<fl.tab.length; ti++) {
				if(tused[fl.tab[ti]]) continue;  tused[fl.tab[ti]] = true;
				var tab = llist[fl.tab[ti]];
				//console.log(tab);

				for(var j=0; j<tab.tabs.length; j++)
				{
					if(tab.tabs[i]==null) continue;
					var ltab = tab.tabs[j], ind;
					if(ltab.coverage) {  ind = Typr._lctf.coverageIndex(ltab.coverage, g1);  if(ind==-1) continue;  }

					if(tab.ltype==1) ;
					else if(tab.ltype==2)
					{
						var adj;
						if(ltab.fmt==1)
						{
							var right = ltab.pairsets[ind];
							for(var i=0; i<right.length; i++) if(right[i].gid2==g2) adj = right[i];
						}
						else if(ltab.fmt==2)
						{
							var c1 = Typr.U._getGlyphClass(g1, ltab.classDef1);
							var c2 = Typr.U._getGlyphClass(g2, ltab.classDef2);
							adj = ltab.matrix[c1][c2];
						}
						//if(adj) console.log(ltab, adj);
						if(adj && adj.val2) return adj.val2[2];
					}
				}
			}
		}
	}
	if(font.kern)
	{
		var ind1 = font.kern.glyph1.indexOf(g1);
		if(ind1!=-1)
		{
			var ind2 = font.kern.rval[ind1].glyph2.indexOf(g2);
			if(ind2!=-1) return font.kern.rval[ind1].vals[ind2];
		}
	}

	return 0;
};

Typr.U.stringToGlyphs = function(font, str)
{
	var gls = [];
	for(var i=0; i<str.length; i++) {
		var cc = str.codePointAt(i);  if(cc>0xffff) i++;
		gls.push(Typr.U.codeToGlyph(font, cc));
	}
	for(var i=0; i<str.length; i++) {
		var cc = str.codePointAt(i);  //
		if(cc==2367) {  var t=gls[i-1];  gls[i-1]=gls[i];  gls[i]=t;  }
		//if(cc==2381) {  var t=gls[i+1];  gls[i+1]=gls[i];  gls[i]=t;  }
		if(cc>0xffff) i++;
	}
	//console.log(gls.slice(0));

	//console.log(gls);  return gls;

	var gsub = font["GSUB"];  if(gsub==null) return gls;
	var llist = gsub.lookupList, flist = gsub.featureList;

	var cligs = ["rlig", "liga", "mset",  "isol","init","fina","medi",   "half", "pres",
				"blws" /* Tibetan fonts like Himalaya.ttf */ ];

	//console.log(gls.slice(0));
	var tused = [];
	for(var fi=0; fi<flist.length; fi++)
	{
		var fl = flist[fi];  if(cligs.indexOf(fl.tag)==-1) continue;
		//if(fl.tag=="blwf") continue;
		//console.log(fl);
		//console.log(fl.tag);
		for(var ti=0; ti<fl.tab.length; ti++) {
			if(tused[fl.tab[ti]]) continue;  tused[fl.tab[ti]] = true;
			var tab = llist[fl.tab[ti]];
			//console.log(fl.tab[ti], tab.ltype);
			//console.log(fl.tag, tab);
			for(var ci=0; ci<gls.length; ci++) {
				var feat = Typr.U._getWPfeature(str, ci);
				if("isol,init,fina,medi".indexOf(fl.tag)!=-1 && fl.tag!=feat) continue;

				Typr.U._applySubs(gls, ci, tab, llist);
			}
		}
	}

	return gls;
};
Typr.U._getWPfeature = function(str, ci) {  // get Word Position feature
	var wsep = "\n\t\" ,.:;!?()  ،";
	var R = "آأؤإاةدذرزوٱٲٳٵٶٷڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙۀۃۄۅۆۇۈۉۊۋۍۏےۓەۮۯܐܕܖܗܘܙܞܨܪܬܯݍݙݚݛݫݬݱݳݴݸݹࡀࡆࡇࡉࡔࡧࡩࡪࢪࢫࢬࢮࢱࢲࢹૅેૉ૊૎૏ૐ૑૒૝ૡ૤૯஁ஃ஄அஉ஌எஏ஑னப஫஬";
	var L = "ꡲ્૗";

	var slft = ci==0            || wsep.indexOf(str[ci-1])!=-1;
	var srgt = ci==str.length-1 || wsep.indexOf(str[ci+1])!=-1;

	if(!slft && R.indexOf(str[ci-1])!=-1) slft=true;
	if(!srgt && R.indexOf(str[ci  ])!=-1) srgt=true;

	if(!srgt && L.indexOf(str[ci+1])!=-1) srgt=true;
	if(!slft && L.indexOf(str[ci  ])!=-1) slft=true;

	var feat = null;
	if(slft) feat = srgt ? "isol" : "init";
	else     feat = srgt ? "fina" : "medi";

	return feat;
};
Typr.U._applySubs = function(gls, ci, tab, llist) {
	var rlim = gls.length-ci-1;
	//if(ci==0) console.log("++++ ", tab.ltype);
	for(var j=0; j<tab.tabs.length; j++)
	{
		if(tab.tabs[j]==null) continue;
		var ltab = tab.tabs[j], ind;
		if(ltab.coverage) {  ind = Typr._lctf.coverageIndex(ltab.coverage, gls[ci]);  if(ind==-1) continue;  }
		//if(ci==0) console.log(ind, ltab);
		//*
		if(tab.ltype==1) {
			var gl = gls[ci];
			if(ltab.fmt==1) gls[ci] = gls[ci]+ltab.delta;
			else            gls[ci] = ltab.newg[ind];
			//console.log("applying ... 1", ci, gl, gls[ci]);
		}//*
		else if(tab.ltype==4) {
			var vals = ltab.vals[ind];

			for(var k=0; k<vals.length; k++) {
				var lig = vals[k], rl = lig.chain.length;  if(rl>rlim) continue;
				var good = true, em1 = 0;
				for(var l=0; l<rl; l++) {  while(gls[ci+em1+(1+l)]==-1)em1++;  if(lig.chain[l]!=gls[ci+em1+(1+l)]) good=false;  }
				if(!good) continue;
				gls[ci]=lig.nglyph;
				for(var l=0; l<rl+em1; l++) gls[ci+l+1]=-1;   break;  // first character changed, other ligatures do not apply anymore
				//console.log("lig", ci, lig.chain, lig.nglyph);
				//console.log("applying ...");
			}
		}
		else  if(tab.ltype==5 && ltab.fmt==2) {
			var cind = Typr._lctf.getInterval(ltab.cDef, gls[ci]);
			var cls = ltab.cDef[cind+2], scs = ltab.scset[cls];
			for(var i=0; i<scs.length; i++) {
				var sc = scs[i], inp = sc.input;
				if(inp.length>rlim) continue;
				var good = true;
				for(var l=0; l<inp.length; l++) {
					var cind2 = Typr._lctf.getInterval(ltab.cDef, gls[ci+1+l]);
					if(cind==-1 && ltab.cDef[cind2+2]!=inp[l]) {  good=false;  break;  }
				}
				if(!good) continue;
				//console.log(ci, gl);
				var lrs = sc.substLookupRecords;
				for(var k=0; k<lrs.length; k+=2)
				{
					var gi = lrs[k], tabi = lrs[k+1];
					//Typr.U._applyType1(gls, ci+gi, llist[tabi]);
					//console.log(tabi, gls[ci+gi], llist[tabi]);
				}
			}
		}
		else if(tab.ltype==6 && ltab.fmt==3) {
			//if(ltab.backCvg.length==0) return;
			if(!Typr.U._glsCovered(gls, ltab.backCvg, ci-ltab.backCvg.length)) continue;
			if(!Typr.U._glsCovered(gls, ltab.inptCvg, ci)) continue;
			if(!Typr.U._glsCovered(gls, ltab.ahedCvg, ci+ltab.inptCvg.length)) continue;
			//console.log(ci, ltab);
			var lr = ltab.lookupRec;  //console.log(ci, gl, lr);
			for(var i=0; i<lr.length; i+=2) {
				var cind = lr[i], tab2 = llist[lr[i+1]];
				//console.log("-", lr[i+1], tab2);
				Typr.U._applySubs(gls, ci+cind, tab2, llist);
			}
		}
		//else console.log("Unknown table", tab.ltype, ltab.fmt);
		//*/
	}
};

Typr.U._glsCovered = function(gls, cvgs, ci) {
	for(var i=0; i<cvgs.length; i++) {
		var ind = Typr._lctf.coverageIndex(cvgs[i], gls[ci+i]);  if(ind==-1) return false;
	}
	return true;
};

Typr.U.glyphsToPath = function(font, gls, clr)
{
	//gls = gls.reverse();//gls.slice(0,12).concat(gls.slice(12).reverse());

	var tpath = {cmds:[], crds:[]};
	var x = 0;

	for(var i=0; i<gls.length; i++)
	{
		var gid = gls[i];  if(gid==-1) continue;
		var gid2 = (i<gls.length-1 && gls[i+1]!=-1)  ? gls[i+1] : 0;
		var path = Typr.U.glyphToPath(font, gid);
		for(var j=0; j<path.crds.length; j+=2)
		{
			tpath.crds.push(path.crds[j] + x);
			tpath.crds.push(path.crds[j+1]);
		}
		if(clr) tpath.cmds.push(clr);
		for(var j=0; j<path.cmds.length; j++) tpath.cmds.push(path.cmds[j]);
		if(clr) tpath.cmds.push("X");
		x += font.hmtx.aWidth[gid];// - font.hmtx.lsBearing[gid];
		if(i<gls.length-1) x += Typr.U.getPairAdjustment(font, gid, gid2);
	}
	return tpath;
};

Typr.U.pathToSVG = function(path, prec)
{
	if(prec==null) prec = 5;
	var out = [], co = 0, lmap = {"M":2,"L":2,"Q":4,"C":6};
	for(var i=0; i<path.cmds.length; i++)
	{
		var cmd = path.cmds[i], cn = co+(lmap[cmd]?lmap[cmd]:0);
		out.push(cmd);
		while(co<cn) {  var c = path.crds[co++];  out.push(parseFloat(c.toFixed(prec))+(co==cn?"":" "));  }
	}
	return out.join("");
};

Typr.U.pathToContext = function(path, ctx)
{
	var c = 0, crds = path.crds;

	for(var j=0; j<path.cmds.length; j++)
	{
		var cmd = path.cmds[j];
		if     (cmd=="M") {
			ctx.moveTo(crds[c], crds[c+1]);
			c+=2;
		}
		else if(cmd=="L") {
			ctx.lineTo(crds[c], crds[c+1]);
			c+=2;
		}
		else if(cmd=="C") {
			ctx.bezierCurveTo(crds[c], crds[c+1], crds[c+2], crds[c+3], crds[c+4], crds[c+5]);
			c+=6;
		}
		else if(cmd=="Q") {
			ctx.quadraticCurveTo(crds[c], crds[c+1], crds[c+2], crds[c+3]);
			c+=4;
		}
		else if(cmd.charAt(0)=="#") {
			ctx.beginPath();
			ctx.fillStyle = cmd;
		}
		else if(cmd=="Z") {
			ctx.closePath();
		}
		else if(cmd=="X") {
			ctx.fill();
		}
	}
};


Typr.U.P = {};
Typr.U.P.moveTo = function(p, x, y)
{
	p.cmds.push("M");  p.crds.push(x,y);
};
Typr.U.P.lineTo = function(p, x, y)
{
	p.cmds.push("L");  p.crds.push(x,y);
};
Typr.U.P.curveTo = function(p, a,b,c,d,e,f)
{
	p.cmds.push("C");  p.crds.push(a,b,c,d,e,f);
};
Typr.U.P.qcurveTo = function(p, a,b,c,d)
{
	p.cmds.push("Q");  p.crds.push(a,b,c,d);
};
Typr.U.P.closePath = function(p) {  p.cmds.push("Z");  };




Typr.U._drawCFF = function(cmds, state, font, pdct, p)
{
	var stack = state.stack;
	var nStems = state.nStems, haveWidth=state.haveWidth, width=state.width, open=state.open;
	var i=0;
	var x=state.x, y=state.y, c1x=0, c1y=0, c2x=0, c2y=0, c3x=0, c3y=0, c4x=0, c4y=0, jpx=0, jpy=0;

	var o = {val:0,size:0};
	//console.log(cmds);
	while(i<cmds.length)
	{
		Typr.CFF.getCharString(cmds, i, o);
		var v = o.val;
		i += o.size;

		if(v=="o1" || v=="o18")  //  hstem || hstemhm
		{
			var hasWidthArg;

			// The number of stem operators on the stack is always even.
			// If the value is uneven, that means a width is specified.
			hasWidthArg = stack.length % 2 !== 0;
			if (hasWidthArg && !haveWidth) {
				width = stack.shift() + pdct.nominalWidthX;
			}

			nStems += stack.length >> 1;
			stack.length = 0;
			haveWidth = true;
		}
		else if(v=="o3" || v=="o23")  // vstem || vstemhm
		{
			var hasWidthArg;

			// The number of stem operators on the stack is always even.
			// If the value is uneven, that means a width is specified.
			hasWidthArg = stack.length % 2 !== 0;
			if (hasWidthArg && !haveWidth) {
				width = stack.shift() + pdct.nominalWidthX;
			}

			nStems += stack.length >> 1;
			stack.length = 0;
			haveWidth = true;
		}
		else if(v=="o4")
		{
			if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + pdct.nominalWidthX;
                        haveWidth = true;
                    }
			if(open) Typr.U.P.closePath(p);

                    y += stack.pop();
					Typr.U.P.moveTo(p,x,y);   open=true;
		}
		else if(v=="o5")
		{
			while (stack.length > 0) {
                        x += stack.shift();
                        y += stack.shift();
                        Typr.U.P.lineTo(p, x, y);
                    }
		}
		else if(v=="o6" || v=="o7")  // hlineto || vlineto
		{
			var count = stack.length;
			var isX = (v == "o6");

			for(var j=0; j<count; j++) {
				var sval = stack.shift();

				if(isX) x += sval;  else  y += sval;
				isX = !isX;
				Typr.U.P.lineTo(p, x, y);
			}
		}
		else if(v=="o8" || v=="o24")	// rrcurveto || rcurveline
		{
			var count = stack.length;
			var index = 0;
			while(index+6 <= count) {
				c1x = x + stack.shift();
				c1y = y + stack.shift();
				c2x = c1x + stack.shift();
				c2y = c1y + stack.shift();
				x = c2x + stack.shift();
				y = c2y + stack.shift();
				Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
				index+=6;
			}
			if(v=="o24")
			{
				x += stack.shift();
				y += stack.shift();
				Typr.U.P.lineTo(p, x, y);
			}
		}
		else if(v=="o11")  break;
		else if(v=="o1234" || v=="o1235" || v=="o1236" || v=="o1237")//if((v+"").slice(0,3)=="o12")
		{
			if(v=="o1234")
			{
				c1x = x   + stack.shift();    // dx1
                c1y = y;                      // dy1
				c2x = c1x + stack.shift();    // dx2
				c2y = c1y + stack.shift();    // dy2
				jpx = c2x + stack.shift();    // dx3
				jpy = c2y;                    // dy3
				c3x = jpx + stack.shift();    // dx4
				c3y = c2y;                    // dy4
				c4x = c3x + stack.shift();    // dx5
				c4y = y;                      // dy5
				x = c4x + stack.shift();      // dx6
				Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
				Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);

			}
			if(v=="o1235")
			{
				c1x = x   + stack.shift();    // dx1
				c1y = y   + stack.shift();    // dy1
				c2x = c1x + stack.shift();    // dx2
				c2y = c1y + stack.shift();    // dy2
				jpx = c2x + stack.shift();    // dx3
				jpy = c2y + stack.shift();    // dy3
				c3x = jpx + stack.shift();    // dx4
				c3y = jpy + stack.shift();    // dy4
				c4x = c3x + stack.shift();    // dx5
				c4y = c3y + stack.shift();    // dy5
				x = c4x + stack.shift();      // dx6
				y = c4y + stack.shift();      // dy6
				stack.shift();                // flex depth
				Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
				Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
			}
			if(v=="o1236")
			{
				c1x = x   + stack.shift();    // dx1
				c1y = y   + stack.shift();    // dy1
				c2x = c1x + stack.shift();    // dx2
				c2y = c1y + stack.shift();    // dy2
				jpx = c2x + stack.shift();    // dx3
				jpy = c2y;                    // dy3
				c3x = jpx + stack.shift();    // dx4
				c3y = c2y;                    // dy4
				c4x = c3x + stack.shift();    // dx5
				c4y = c3y + stack.shift();    // dy5
				x = c4x + stack.shift();      // dx6
				Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
				Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
			}
			if(v=="o1237")
			{
				c1x = x   + stack.shift();    // dx1
				c1y = y   + stack.shift();    // dy1
				c2x = c1x + stack.shift();    // dx2
				c2y = c1y + stack.shift();    // dy2
				jpx = c2x + stack.shift();    // dx3
				jpy = c2y + stack.shift();    // dy3
				c3x = jpx + stack.shift();    // dx4
				c3y = jpy + stack.shift();    // dy4
				c4x = c3x + stack.shift();    // dx5
				c4y = c3y + stack.shift();    // dy5
				if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
				    x = c4x + stack.shift();
				} else {
				    y = c4y + stack.shift();
				}
				Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
				Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
			}
		}
		else if(v=="o14")
		{
			if (stack.length > 0 && !haveWidth) {
                        width = stack.shift() + font.nominalWidthX;
                        haveWidth = true;
                    }
			if(stack.length==4) // seac = standard encoding accented character
			{
				var adx = stack.shift();
				var ady = stack.shift();
				var bchar = stack.shift();
				var achar = stack.shift();


				var bind = Typr.CFF.glyphBySE(font, bchar);
				var aind = Typr.CFF.glyphBySE(font, achar);

				//console.log(bchar, bind);
				//console.log(achar, aind);
				//state.x=x; state.y=y; state.nStems=nStems; state.haveWidth=haveWidth; state.width=width;  state.open=open;

				Typr.U._drawCFF(font.CharStrings[bind], state,font,pdct,p);
				state.x = adx; state.y = ady;
				Typr.U._drawCFF(font.CharStrings[aind], state,font,pdct,p);

				//x=state.x; y=state.y; nStems=state.nStems; haveWidth=state.haveWidth; width=state.width;  open=state.open;
			}
			if(open) {  Typr.U.P.closePath(p);  open=false;  }
		}
		else if(v=="o19" || v=="o20")
		{
			var hasWidthArg;

			// The number of stem operators on the stack is always even.
			// If the value is uneven, that means a width is specified.
			hasWidthArg = stack.length % 2 !== 0;
			if (hasWidthArg && !haveWidth) {
				width = stack.shift() + pdct.nominalWidthX;
			}

			nStems += stack.length >> 1;
			stack.length = 0;
			haveWidth = true;

			i += (nStems + 7) >> 3;
		}

		else if(v=="o21") {
			if (stack.length > 2 && !haveWidth) {
                        width = stack.shift() + pdct.nominalWidthX;
                        haveWidth = true;
                    }

                    y += stack.pop();
                    x += stack.pop();

					if(open) Typr.U.P.closePath(p);
                    Typr.U.P.moveTo(p,x,y);   open=true;
		}
		else if(v=="o22")
		{
			 if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + pdct.nominalWidthX;
                        haveWidth = true;
                    }

                    x += stack.pop();

					if(open) Typr.U.P.closePath(p);
					Typr.U.P.moveTo(p,x,y);   open=true;
		}
		else if(v=="o25")
		{
			while (stack.length > 6) {
                        x += stack.shift();
                        y += stack.shift();
                        Typr.U.P.lineTo(p, x, y);
                    }

                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
		}
		else if(v=="o26")
		{
			if (stack.length % 2) {
                        x += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x;
                        y = c2y + stack.shift();
                        Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
                    }

		}
		else if(v=="o27")
		{
			if (stack.length % 2) {
                        y += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y;
                        Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
                    }
		}
		else if(v=="o10" || v=="o29")	// callsubr || callgsubr
		{
			var obj = (v=="o10" ? pdct : font);
			if(stack.length==0) { console.log("error: empty stack");  }
			else {
				var ind = stack.pop();
				var subr = obj.Subrs[ ind + obj.Bias ];
				state.x=x; state.y=y; state.nStems=nStems; state.haveWidth=haveWidth; state.width=width;  state.open=open;
				Typr.U._drawCFF(subr, state,font,pdct,p);
				x=state.x; y=state.y; nStems=state.nStems; haveWidth=state.haveWidth; width=state.width;  open=state.open;
			}
		}
		else if(v=="o30" || v=="o31")   // vhcurveto || hvcurveto
		{
			var count, count1 = stack.length;
			var index = 0;
			var alternate = v == "o31";

			count  = count1 & ~2;
			index += count1 - count;

			while ( index < count )
			{
				if(alternate)
				{
					c1x = x + stack.shift();
					c1y = y;
					c2x = c1x + stack.shift();
					c2y = c1y + stack.shift();
					y = c2y + stack.shift();
					if(count-index == 5) {  x = c2x + stack.shift();  index++;  }
					else x = c2x;
					alternate = false;
				}
				else
				{
					c1x = x;
					c1y = y + stack.shift();
					c2x = c1x + stack.shift();
					c2y = c1y + stack.shift();
					x = c2x + stack.shift();
					if(count-index == 5) {  y = c2y + stack.shift();  index++;  }
					else y = c2y;
					alternate = true;
				}
                Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
				index += 4;
			}
		}

		else if((v+"").charAt(0)=="o") {   console.log("Unknown operation: "+v, cmds); throw v;  }
		else stack.push(v);
	}
	//console.log(cmds);
	state.x=x; state.y=y; state.nStems=nStems; state.haveWidth=haveWidth; state.width=width; state.open=open;
};

// End Typr.U.js

return Typr

}

// Custom bundle of woff2otf (https://github.com/arty-name/woff2otf) with tiny-inflate
// (https://github.com/foliojs/tiny-inflate) for use in troika-3d-text.
// Original licenses apply:
// - tiny-inflate: https://github.com/foliojs/tiny-inflate/blob/master/LICENSE (MIT)
// - woff2otf.js: https://github.com/arty-name/woff2otf/blob/master/woff2otf.js (Apache2)

function woff2otfFactory() {

// Begin tinyInflate
const tinyInflate = (function() {
  const module = {};
  var TINF_OK = 0;
var TINF_DATA_ERROR = -3;

function Tree() {
  this.table = new Uint16Array(16);   /* table of code length counts */
  this.trans = new Uint16Array(288);  /* code -> symbol translation table */
}

function Data(source, dest) {
  this.source = source;
  this.sourceIndex = 0;
  this.tag = 0;
  this.bitcount = 0;

  this.dest = dest;
  this.destLen = 0;

  this.ltree = new Tree();  /* dynamic length/symbol tree */
  this.dtree = new Tree();  /* dynamic distance tree */
}

/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */

var sltree = new Tree();
var sdtree = new Tree();

/* extra bits and base tables for length codes */
var length_bits = new Uint8Array(30);
var length_base = new Uint16Array(30);

/* extra bits and base tables for distance codes */
var dist_bits = new Uint8Array(30);
var dist_base = new Uint16Array(30);

/* special ordering of code length codes */
var clcidx = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6,
  10, 5, 11, 4, 12, 3, 13, 2,
  14, 1, 15
]);

/* used by tinf_decode_trees, avoids allocations every call */
var code_tree = new Tree();
var lengths = new Uint8Array(288 + 32);

/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */

/* build extra bits and base tables */
function tinf_build_bits_base(bits, base, delta, first) {
  var i, sum;

  /* build bits table */
  for (i = 0; i < delta; ++i) bits[i] = 0;
  for (i = 0; i < 30 - delta; ++i) bits[i + delta] = i / delta | 0;

  /* build base table */
  for (sum = first, i = 0; i < 30; ++i) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

/* build the fixed huffman trees */
function tinf_build_fixed_trees(lt, dt) {
  var i;

  /* build fixed length tree */
  for (i = 0; i < 7; ++i) lt.table[i] = 0;

  lt.table[7] = 24;
  lt.table[8] = 152;
  lt.table[9] = 112;

  for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
  for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
  for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
  for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;

  /* build fixed distance tree */
  for (i = 0; i < 5; ++i) dt.table[i] = 0;

  dt.table[5] = 32;

  for (i = 0; i < 32; ++i) dt.trans[i] = i;
}

/* given an array of code lengths, build a tree */
var offs = new Uint16Array(16);

function tinf_build_tree(t, lengths, off, num) {
  var i, sum;

  /* clear code length count table */
  for (i = 0; i < 16; ++i) t.table[i] = 0;

  /* scan symbol lengths, and sum code length counts */
  for (i = 0; i < num; ++i) t.table[lengths[off + i]]++;

  t.table[0] = 0;

  /* compute offset table for distribution sort */
  for (sum = 0, i = 0; i < 16; ++i) {
    offs[i] = sum;
    sum += t.table[i];
  }

  /* create code->symbol translation table (symbols sorted by code) */
  for (i = 0; i < num; ++i) {
    if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
  }
}

/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */

/* get one bit from source stream */
function tinf_getbit(d) {
  /* check if tag is empty */
  if (!d.bitcount--) {
    /* load next tag */
    d.tag = d.source[d.sourceIndex++];
    d.bitcount = 7;
  }

  /* shift bit out of tag */
  var bit = d.tag & 1;
  d.tag >>>= 1;

  return bit;
}

/* read a num bit value from a stream and add base */
function tinf_read_bits(d, num, base) {
  if (!num)
    return base;

  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }

  var val = d.tag & (0xffff >>> (16 - num));
  d.tag >>>= num;
  d.bitcount -= num;
  return val + base;
}

/* given a data stream and a tree, decode a symbol */
function tinf_decode_symbol(d, t) {
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }

  var sum = 0, cur = 0, len = 0;
  var tag = d.tag;

  /* get more bits while code value is above sum */
  do {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    ++len;

    sum += t.table[len];
    cur -= t.table[len];
  } while (cur >= 0);

  d.tag = tag;
  d.bitcount -= len;

  return t.trans[sum + cur];
}

/* given a data stream, decode dynamic trees from it */
function tinf_decode_trees(d, lt, dt) {
  var hlit, hdist, hclen;
  var i, num, length;

  /* get 5 bits HLIT (257-286) */
  hlit = tinf_read_bits(d, 5, 257);

  /* get 5 bits HDIST (1-32) */
  hdist = tinf_read_bits(d, 5, 1);

  /* get 4 bits HCLEN (4-19) */
  hclen = tinf_read_bits(d, 4, 4);

  for (i = 0; i < 19; ++i) lengths[i] = 0;

  /* read code lengths for code length alphabet */
  for (i = 0; i < hclen; ++i) {
    /* get 3 bits code length (0-7) */
    var clen = tinf_read_bits(d, 3, 0);
    lengths[clcidx[i]] = clen;
  }

  /* build code length tree */
  tinf_build_tree(code_tree, lengths, 0, 19);

  /* decode code lengths for the dynamic trees */
  for (num = 0; num < hlit + hdist;) {
    var sym = tinf_decode_symbol(d, code_tree);

    switch (sym) {
      case 16:
        /* copy previous code length 3-6 times (read 2 bits) */
        var prev = lengths[num - 1];
        for (length = tinf_read_bits(d, 2, 3); length; --length) {
          lengths[num++] = prev;
        }
        break;
      case 17:
        /* repeat code length 0 for 3-10 times (read 3 bits) */
        for (length = tinf_read_bits(d, 3, 3); length; --length) {
          lengths[num++] = 0;
        }
        break;
      case 18:
        /* repeat code length 0 for 11-138 times (read 7 bits) */
        for (length = tinf_read_bits(d, 7, 11); length; --length) {
          lengths[num++] = 0;
        }
        break;
      default:
        /* values 0-15 represent the actual code lengths */
        lengths[num++] = sym;
        break;
    }
  }

  /* build dynamic trees */
  tinf_build_tree(lt, lengths, 0, hlit);
  tinf_build_tree(dt, lengths, hlit, hdist);
}

/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */

/* given a stream and two trees, inflate a block of data */
function tinf_inflate_block_data(d, lt, dt) {
  while (1) {
    var sym = tinf_decode_symbol(d, lt);

    /* check for end of block */
    if (sym === 256) {
      return TINF_OK;
    }

    if (sym < 256) {
      d.dest[d.destLen++] = sym;
    } else {
      var length, dist, offs;
      var i;

      sym -= 257;

      /* possibly get more bits from length code */
      length = tinf_read_bits(d, length_bits[sym], length_base[sym]);

      dist = tinf_decode_symbol(d, dt);

      /* possibly get more bits from distance code */
      offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);

      /* copy match */
      for (i = offs; i < offs + length; ++i) {
        d.dest[d.destLen++] = d.dest[i];
      }
    }
  }
}

/* inflate an uncompressed block of data */
function tinf_inflate_uncompressed_block(d) {
  var length, invlength;
  var i;

  /* unread from bitbuffer */
  while (d.bitcount > 8) {
    d.sourceIndex--;
    d.bitcount -= 8;
  }

  /* get length */
  length = d.source[d.sourceIndex + 1];
  length = 256 * length + d.source[d.sourceIndex];

  /* get one's complement of length */
  invlength = d.source[d.sourceIndex + 3];
  invlength = 256 * invlength + d.source[d.sourceIndex + 2];

  /* check length */
  if (length !== (~invlength & 0x0000ffff))
    return TINF_DATA_ERROR;

  d.sourceIndex += 4;

  /* copy block */
  for (i = length; i; --i)
    d.dest[d.destLen++] = d.source[d.sourceIndex++];

  /* make sure we start next block on a byte boundary */
  d.bitcount = 0;

  return TINF_OK;
}

/* inflate stream from source to dest */
function tinf_uncompress(source, dest) {
  var d = new Data(source, dest);
  var bfinal, btype, res;

  do {
    /* read final block flag */
    bfinal = tinf_getbit(d);

    /* read block type (2 bits) */
    btype = tinf_read_bits(d, 2, 0);

    /* decompress block */
    switch (btype) {
      case 0:
        /* decompress uncompressed block */
        res = tinf_inflate_uncompressed_block(d);
        break;
      case 1:
        /* decompress block with fixed huffman trees */
        res = tinf_inflate_block_data(d, sltree, sdtree);
        break;
      case 2:
        /* decompress block with dynamic huffman trees */
        tinf_decode_trees(d, d.ltree, d.dtree);
        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
        break;
      default:
        res = TINF_DATA_ERROR;
    }

    if (res !== TINF_OK)
      throw new Error('Data error');

  } while (!bfinal);

  if (d.destLen < d.dest.length) {
    if (typeof d.dest.slice === 'function')
      return d.dest.slice(0, d.destLen);
    else
      return d.dest.subarray(0, d.destLen);
  }

  return d.dest;
}

/* -------------------- *
 * -- initialization -- *
 * -------------------- */

/* build fixed huffman trees */
tinf_build_fixed_trees(sltree, sdtree);

/* build extra bits and base tables */
tinf_build_bits_base(length_bits, length_base, 4, 3);
tinf_build_bits_base(dist_bits, dist_base, 2, 1);

/* fix a special case */
length_bits[28] = 0;
length_base[28] = 258;

module.exports = tinf_uncompress;

  return module.exports
})();
// End tinyInflate

// Begin woff2otf.js
/*
 Copyright 2012, Steffen Hanikel (https://github.com/hanikesn)
 Modified by Artemy Tregubenko, 2014 (https://github.com/arty-name/woff2otf)
 Modified by Jason Johnston, 2019 (pako --> tiny-inflate)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 A tool to convert a WOFF back to a TTF/OTF font file, in pure Javascript
*/

function convert_streams(bufferIn, tinyInflate) {
    var dataViewIn = new DataView(bufferIn);
    var offsetIn = 0;

    function read2() {
        var uint16 = dataViewIn.getUint16(offsetIn);
        offsetIn += 2;
        return uint16;
    }

    function read4() {
        var uint32 = dataViewIn.getUint32(offsetIn);
        offsetIn += 4;
        return uint32;
    }

    function write2(uint16) {
        dataViewOut.setUint16(offsetOut, uint16);
        offsetOut += 2;
    }

    function write4(uint32) {
        dataViewOut.setUint32(offsetOut, uint32);
        offsetOut += 4;
    }

    var WOFFHeader = {
        signature: read4(),
        flavor: read4(),
        length: read4(),
        numTables: read2(),
        reserved: read2(),
        totalSfntSize: read4(),
        majorVersion: read2(),
        minorVersion: read2(),
        metaOffset: read4(),
        metaLength: read4(),
        metaOrigLength: read4(),
        privOffset: read4(),
        privLength: read4()
    };

    var entrySelector = 0;
    while (Math.pow(2, entrySelector) <= WOFFHeader.numTables) {
        entrySelector++;
    }
    entrySelector--;

    var searchRange = Math.pow(2, entrySelector) * 16;
    var rangeShift = WOFFHeader.numTables * 16 - searchRange;

    var offset = 4 + 2 + 2 + 2 + 2;
    var TableDirectoryEntries = [];
    for (var i = 0; i < WOFFHeader.numTables; i++) {
        TableDirectoryEntries.push({
            tag: read4(),
            offset: read4(),
            compLength: read4(),
            origLength: read4(),
            origChecksum: read4()
        });
        offset += 4 * 4;
    }

    var arrayOut = new Uint8Array(
        4 + 2 + 2 + 2 + 2 +
        TableDirectoryEntries.length * (4 + 4 + 4 + 4) +
        TableDirectoryEntries.reduce(function(acc, entry) { return acc + entry.origLength + 4; }, 0)
    );
    var bufferOut = arrayOut.buffer;
    var dataViewOut = new DataView(bufferOut);
    var offsetOut = 0;

    write4(WOFFHeader.flavor);
    write2(WOFFHeader.numTables);
    write2(searchRange);
    write2(entrySelector);
    write2(rangeShift);

    TableDirectoryEntries.forEach(function(TableDirectoryEntry) {
        write4(TableDirectoryEntry.tag);
        write4(TableDirectoryEntry.origChecksum);
        write4(offset);
        write4(TableDirectoryEntry.origLength);

        TableDirectoryEntry.outOffset = offset;
        offset += TableDirectoryEntry.origLength;
        if ((offset % 4) != 0) {
            offset += 4 - (offset % 4);
        }
    });

    var size;

    TableDirectoryEntries.forEach(function(TableDirectoryEntry) {
        var compressedData = bufferIn.slice(
            TableDirectoryEntry.offset,
            TableDirectoryEntry.offset + TableDirectoryEntry.compLength
        );

        if (TableDirectoryEntry.compLength != TableDirectoryEntry.origLength) {
            var uncompressedData = new Uint8Array(TableDirectoryEntry.origLength);
            tinyInflate(
              new Uint8Array(compressedData, 2), //skip deflate header
              uncompressedData
            );
        } else {
            uncompressedData = new Uint8Array(compressedData);
        }

        arrayOut.set(uncompressedData, TableDirectoryEntry.outOffset);
        offset = TableDirectoryEntry.outOffset + TableDirectoryEntry.origLength;

        var padding = 0;
        if ((offset % 4) != 0) {
            padding = 4 - (offset % 4);
        }
        arrayOut.set(
            new Uint8Array(padding).buffer,
            TableDirectoryEntry.outOffset + TableDirectoryEntry.origLength
        );

        size = offset + padding;
    });

    return bufferOut.slice(0, size);
}

// End woff2otf.js

return function(buffer) {
  return convert_streams(buffer, tinyInflate)
}

}

/**
 * An adapter that allows Typr.js to be used as if it were (a subset of) the OpenType.js API.
 * Also adds support for WOFF files (not WOFF2).
 */

function parserFactory(Typr, woff2otf) {
  const cmdArgLengths = {
    M: 2,
    L: 2,
    Q: 4,
    C: 6,
    Z: 0
  };

  function wrapFontObj(typrFont) {
    const glyphMap = Object.create(null);

    const fontObj = {
      unitsPerEm: typrFont.head.unitsPerEm,
      ascender: typrFont.hhea.ascender,
      descender: typrFont.hhea.descender,
      forEachGlyph(text, fontSize, letterSpacing, callback) {
        let glyphX = 0;
        const fontScale = 1 / fontObj.unitsPerEm * fontSize;

        const glyphIndices = Typr.U.stringToGlyphs(typrFont, text);
        let charIndex = 0;
        glyphIndices.forEach(glyphIndex => {
          // Typr returns a glyph index per string codepoint, with -1s in place of those that
          // were omitted due to ligature substitution. So we can track original index in the
          // string via simple increment, and skip everything else when seeing a -1.
          if (glyphIndex !== -1) {
            let glyphObj = glyphMap[glyphIndex];
            if (!glyphObj) {
              const {cmds, crds} = Typr.U.glyphToPath(typrFont, glyphIndex);

              // Find extents - Glyf gives this in metadata but not CFF, and Typr doesn't
              // normalize the two, so it's simplest just to iterate ourselves.
              let xMin, yMin, xMax, yMax;
              if (crds.length) {
                xMin = yMin = Infinity;
                xMax = yMax = -Infinity;
                for (let i = 0, len = crds.length; i < len; i += 2) {
                  let x = crds[i];
                  let y = crds[i + 1];
                  if (x < xMin) xMin = x;
                  if (y < yMin) yMin = y;
                  if (x > xMax) xMax = x;
                  if (y > yMax) yMax = y;
                }
              } else {
                xMin = xMax = yMin = yMax = 0;
              }

              glyphObj = glyphMap[glyphIndex] = {
                index: glyphIndex,
                advanceWidth: typrFont.hmtx.aWidth[glyphIndex],
                xMin,
                yMin,
                xMax,
                yMax,
                pathCommandCount: cmds.length,
                forEachPathCommand(callback) {
                  let argsIndex = 0;
                  const argsArray = [];
                  for (let i = 0, len = cmds.length; i < len; i++) {
                    const numArgs = cmdArgLengths[cmds[i]];
                    argsArray.length = 1 + numArgs;
                    argsArray[0] = cmds[i];
                    for (let j = 1; j <= numArgs; j++) {
                      argsArray[j] = crds[argsIndex++];
                    }
                    callback.apply(null, argsArray);
                  }
                }
              };
            }

            callback.call(null, glyphObj, glyphX, charIndex);

            if (glyphObj.advanceWidth) {
              glyphX += glyphObj.advanceWidth * fontScale;
            }
            if (letterSpacing) {
              glyphX += letterSpacing * fontSize;
            }
          }
          charIndex += (text.codePointAt(charIndex) > 0xffff ? 2 : 1);
        });
        return glyphX
      }
    };

    return fontObj
  }

  return function parse(buffer) {
    // Look to see if we have a WOFF file and convert it if so:
    const peek = new Uint8Array(buffer, 0, 4);
    const tag = Typr._bin.readASCII(peek, 0, 4);
    if (tag === 'wOFF') {
      buffer = woff2otf(buffer);
    } else if (tag === 'wOF2') {
      throw new Error('woff2 fonts not supported')
    }
    return wrapFontObj(Typr.parse(buffer)[0])
  }
}


const workerModule = defineWorkerModule({
  name: 'Typr Font Parser',
  dependencies: [typrFactory, woff2otfFactory, parserFactory],
  init(typrFactory, woff2otfFactory, parserFactory) {
    const Typr = typrFactory();
    const woff2otf = woff2otfFactory();
    return parserFactory(Typr, woff2otf)
  }
});

//import fontParser from './FontParser_OpenType.js'


const CONFIG = {
  defaultFontURL: 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff', //Roboto Regular
  sdfGlyphSize: 64,
  textureWidth: 2048
};
const tempColor = new Color();

/**
 * Customizes the text builder configuration. This must be called prior to the first font processing
 * request, and applies to all fonts.
 *
 * @param {String} config.defaultFontURL - The URL of the default font to use for text processing
 *                 requests, in case none is specified or the specifiede font fails to load or parse.
 *                 Defaults to "Roboto Regular" from Google Fonts.
 * @param {Number} config.sdfGlyphSize - The default size of each glyph's SDF (signed distance field)
 *                 texture used for rendering. Must be a power-of-two number, and applies to all fonts,
 *                 but note that this can also be overridden per call to `getTextRenderInfo()`.
 *                 Larger sizes can improve the quality of glyph rendering by increasing the sharpness
 *                 of corners and preventing loss of very thin lines, at the expense of memory. Defaults
 *                 to 64 which is generally a good balance of size and quality.
 * @param {Number} config.textureWidth - The width of the SDF texture; must be a power of 2. Defaults to
 *                 2048 which is a safe maximum texture dimension according to the stats at
 *                 https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE and should allow for a
 *                 reasonably large number of glyphs (default glyph size of 64 and safe texture size of
 *                 2048^2 allows for 1024 glyphs.) This can be increased if you need to increase the
 *                 glyph size and/or have an extraordinary number of glyphs.
 */
function configureTextBuilder(config) {
  {
    assign(CONFIG, config);
  }
}


/**
 * The radial distance from glyph edges over which the SDF alpha will be calculated; if the alpha
 * at distance:0 is 0.5, then the alpha at this distance will be zero. This is defined as a percentage
 * of each glyph's maximum dimension in font space units so that it maps to the same minimum number of
 * SDF texels regardless of the glyph's size. A larger value provides greater alpha gradient resolution
 * and improves readability/antialiasing quality at small display sizes, but also decreases the number
 * of texels available for encoding path details.
 */
const SDF_DISTANCE_PERCENT = 1 / 8;


/**
 * Repository for all font SDF atlas textures
 *
 *   {
 *     [font]: {
 *       sdfTexture: DataTexture
 *     }
 *   }
 */
const atlases = Object.create(null);

/**
 * @typedef {object} TroikaTextRenderInfo - Format of the result from `getTextRenderInfo`.
 * @property {object} parameters - The normalized input arguments to the render call.
 * @property {DataTexture} sdfTexture - The SDF atlas texture.
 * @property {number} sdfGlyphSize - The size of each glyph's SDF.
 * @property {number} sdfMinDistancePercent - See `SDF_DISTANCE_PERCENT`
 * @property {Float32Array} glyphBounds - List of [minX, minY, maxX, maxY] quad bounds for each glyph.
 * @property {Float32Array} glyphAtlasIndices - List holding each glyph's index in the SDF atlas.
 * @property {Uint8Array} [glyphColors] - List holding each glyph's [r, g, b] color, if `colorRanges` was supplied.
 * @property {Float32Array} [caretPositions] - A list of caret positions for all glyphs; this is
 *           the bottom [x,y] of the cursor position before each char, plus one after the last char.
 * @property {number} [caretHeight] - An appropriate height for all selection carets.
 * @property {number} ascender - The font's ascender metric.
 * @property {number} descender - The font's descender metric.
 * @property {number} lineHeight - The final computed lineHeight measurement.
 * @property {number} topBaseline - The y position of the top line's baseline.
 * @property {Array<number>} totalBounds - The total [minX, minY, maxX, maxY] rect including all glyph
 *           quad bounds; this will be slightly larger than the actual glyph path edges due to SDF padding.
 * @property {Array<number>} totalBlockSize - The [width, height] of the text block; this does not include
 *           extra SDF padding so it is accurate to use for measurement.
 * @property {Array<number>} chunkedBounds - List of bounding rects for each consecutive set of N glyphs,
 *           in the format `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`.
 * @property {object} timings - Timing info for various parts of the rendering logic including SDF
 *           generation, layout, etc.
 * @frozen
 */

/**
 * @callback getTextRenderInfo~callback
 * @param {TroikaTextRenderInfo} textRenderInfo
 */

/**
 * 用于请求呈现具有给定字体参数的文本字符串所需数据的主要入口点。
 * 这是一个异步调用，执行Web工作线程中的大部分逻辑。
 * @param {object} args
 * @param {getTextRenderInfo~callback} callback
 */
function getTextRenderInfo(args, callback) {
  args = assign({}, args);

  // Apply default font here to avoid a 'null' atlas, and convert relative
  // URLs to absolute so they can be resolved in the worker
  args.font = toAbsoluteURL(args.font || CONFIG.defaultFontURL);

  // Normalize text to a string
  args.text = '' + args.text;

  args.sdfGlyphSize = args.sdfGlyphSize || CONFIG.sdfGlyphSize;

  // Normalize colors
  if (args.colorRanges != null) {
    let colors = {};
    for (let key in args.colorRanges) {
      if (args.colorRanges.hasOwnProperty(key)) {
        let val = args.colorRanges[key];
        if (typeof val !== 'number') {
          val = tempColor.set(val).getHex();
        }
        colors[key] = val;
      }
    }
    args.colorRanges = colors;
  }

  Object.freeze(args);

  // Init the atlas for this font if needed
  const {textureWidth} = CONFIG;
  const {sdfGlyphSize} = args;
  let atlasKey = `${args.font}@${sdfGlyphSize}`;
  let atlas = atlases[atlasKey];
  if (!atlas) {
    atlas = atlases[atlasKey] = {
      sdfTexture: new DataTexture(
        new Uint8Array(sdfGlyphSize * textureWidth),
        textureWidth,
        sdfGlyphSize,
        LuminanceFormat,
        undefined,
        undefined,
        undefined,
        undefined,
        LinearFilter,
        LinearFilter
      )
    };
    atlas.sdfTexture.font = args.font;
  }

  // 向Worker中的FontProcessor发出请求
  processInWorker(args).then(result => {
    // 如果响应具有newGlyphs，则将其复制到指定索引处的atlas纹理中
    if (result.newGlyphSDFs) {
      result.newGlyphSDFs.forEach(({textureData, atlasIndex}) => {
        const texImg = atlas.sdfTexture.image;

        // Grow the texture by power of 2 if needed
        while (texImg.data.length < (atlasIndex + 1) * sdfGlyphSize * sdfGlyphSize) {
          const biggerArray = new Uint8Array(texImg.data.length * 2);
          biggerArray.set(texImg.data);
          texImg.data = biggerArray;
          texImg.height *= 2;
        }

        // Insert the new glyph's data into the full texture image at the correct offsets
        const cols = texImg.width / sdfGlyphSize;
        for (let y = 0; y < sdfGlyphSize; y++) {
          const srcStartIndex = y * sdfGlyphSize;
          const tgtStartIndex = texImg.width * sdfGlyphSize * Math.floor(atlasIndex / cols) //full rows
            + (atlasIndex % cols) * sdfGlyphSize //partial row
            + (y * texImg.width); //row within glyph
          for (let x = 0; x < sdfGlyphSize; x++) {
            texImg.data[tgtStartIndex + x] = textureData[srcStartIndex + x];
          }
        }
      });
      atlas.sdfTexture.needsUpdate = true;
    }

    // 使用文本布局数组和更新的纹理调用回调
    callback(Object.freeze({
      parameters: args,
      sdfTexture: atlas.sdfTexture,
      sdfGlyphSize,
      sdfMinDistancePercent: SDF_DISTANCE_PERCENT,
      glyphBounds: result.glyphBounds,
      glyphAtlasIndices: result.glyphAtlasIndices,
      glyphColors: result.glyphColors,
      caretPositions: result.caretPositions,
      caretHeight: result.caretHeight,
      chunkedBounds: result.chunkedBounds,
      ascender: result.ascender,
      descender: result.descender,
      lineHeight: result.lineHeight,
      topBaseline: result.topBaseline,
      totalBounds: result.totalBounds,
      totalBlockSize: result.totalBlockSize,
      timings: result.timings
    }));
  });
}


/**
 * Preload a given font and optionally pre-generate glyph SDFs for one or more character sequences.
 * This can be useful to avoid long pauses when first showing text in a scene, by preloading the
 * needed fonts and glyphs up front along with other assets.
 *
 * @param {object} options
 * @param {string} options.font - URL of the font file to preload. If not given, the default font will
 *        be loaded.
 * @param {string|string[]} options.characters - One or more character sequences for which to pre-
 *        generate glyph SDFs. Note that this will honor ligature substitution, so you may need
 *        to specify ligature sequences in addition to their individual characters to get all
 *        possible glyphs, e.g. `["t", "h", "th"]` to get the "t" and "h" glyphs plus the "th" ligature.
 * @param {number} options.sdfGlyphSize - The size at which to prerender the SDF textures for the
 *        specified `characters`.
 * @param {function} callback - A function that will be called when the preloading is complete.
 */
function preloadFont({font, characters, sdfGlyphSize}, callback) {
  let text = Array.isArray(characters) ? characters.join('\n') : '' + characters;
  getTextRenderInfo({ font, sdfGlyphSize, text }, callback);
}


// Local assign impl so we don't have to import troika-core
function assign(toObj, fromObj) {
  for (let key in fromObj) {
    if (fromObj.hasOwnProperty(key)) {
      toObj[key] = fromObj[key];
    }
  }
  return toObj
}

// Utility for making URLs absolute
let linkEl;
function toAbsoluteURL(path) {
  if (!linkEl) {
    linkEl = typeof document === 'undefined' ? {} : document.createElement('a');
  }
  linkEl.href = path;
  return linkEl.href
}


const fontProcessorWorkerModule = defineWorkerModule({
  name: 'FontProcessor',
  dependencies: [
    CONFIG,
    SDF_DISTANCE_PERCENT,
    workerModule,
    createGlyphSegmentsQuadtree,
    createSDFGenerator,
    createFontProcessor
  ],
  init(config, sdfDistancePercent, fontParser, createGlyphSegmentsQuadtree, createSDFGenerator, createFontProcessor) {
    const sdfGenerator = createSDFGenerator(
      createGlyphSegmentsQuadtree,
      {
        sdfDistancePercent
      }
    );
    return createFontProcessor(fontParser, sdfGenerator, {
      defaultFontUrl: config.defaultFontURL
    })
  }
});

const processInWorker = defineWorkerModule({
  name: 'TextBuilder',
  dependencies: [fontProcessorWorkerModule, ThenableWorkerModule],
  init(fontProcessor, Thenable) {
    return function(args) {
      const thenable = new Thenable();
      fontProcessor.process(args, thenable.resolve);
      return thenable
    }
  },
  getTransferables(result) {
    // Mark array buffers as transferable to avoid cloning during postMessage
    const transferables = [
      result.glyphBounds.buffer,
      result.glyphAtlasIndices.buffer
    ];
    if (result.caretPositions) {
      transferables.push(result.caretPositions.buffer);
    }
    if (result.newGlyphSDFs) {
      result.newGlyphSDFs.forEach(d => {
        transferables.push(d.textureData.buffer);
      });
    }
    return transferables
  }
});

const templateGeometries = {};
function getTemplateGeometry(detail) {
  let geom = templateGeometries[detail];
  if (!geom) {
    geom = templateGeometries[detail] = new PlaneBufferGeometry(
      1,
      1,
      detail,
      detail
    ).translate(0.5, 0.5, 0);
  }
  return geom;
}
const tempVec3 = new Vector3();

const glyphBoundsAttrName = "aTroikaGlyphBounds";
const glyphIndexAttrName = "aTroikaGlyphIndex";
const glyphColorAttrName = "aTroikaGlyphColor";

/**
@class GlyphsGeometry

A specialized Geometry for rendering a set of text glyphs. Uses InstancedBufferGeometry to
render the glyphs using GPU instancing of a single quad, rather than constructing a whole
geometry with vertices, for much smaller attribute arraybuffers according to this math:

  Where N = number of glyphs...

  Instanced:
  - position: 4 * 3
  - index: 2 * 3
  - normal: 4 * 3
  - uv: 4 * 2
  - glyph x/y bounds: N * 4
  - glyph indices: N * 1
  = 5N + 38

  Non-instanced:
  - position: N * 4 * 3
  - index: N * 2 * 3
  - normal: N * 4 * 3
  - uv: N * 4 * 2
  - glyph indices: N * 1
  = 39N

A downside of this is the rare-but-possible lack of the instanced arrays extension,
which we could potentially work around with a fallback non-instanced implementation.

*/
class GlyphsGeometry extends InstancedBufferGeometry {
  constructor() {
    super();

    this.detail = 1;

    // Preallocate zero-radius bounding sphere
    this.boundingSphere = new Sphere();
    this.boundingBox = new Box3();
  }

  computeBoundingSphere() {
    // No-op; we'll sync the boundingSphere proactively in `updateGlyphs`.
  }

  computeBoundingBox() {
    // No-op; we'll sync the boundingBox proactively in `updateGlyphs`.
  }

  set detail(detail) {
    if (detail !== this._detail) {
      this._detail = detail;
      if (typeof detail !== "number" || detail < 1) {
        detail = 1;
      }
      let tpl = getTemplateGeometry(detail);
      ["position", "normal", "uv"].forEach((attr) => {
        this.attributes[attr] = tpl.attributes[attr].clone();
      });
      this.setIndex(tpl.getIndex().clone());
    }
  }
  get detail() {
    return this._detail;
  }

  /**
   * Update the geometry for a new set of glyphs.
   * @param {Float32Array} glyphBounds - An array holding the planar bounds for all glyphs
   *        to be rendered, 4 entries for each glyph: x1,x2,y1,y1
   * @param {Float32Array} glyphAtlasIndices - An array holding the index of each glyph within
   *        the SDF atlas texture.
   * @param {Array} totalBounds - An array holding the [minX, minY, maxX, maxY] across all glyphs
   * @param {Array} [chunkedBounds] - An array of objects describing bounds for each chunk of N
   *        consecutive glyphs: `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`. This can be
   *        used with `applyClipRect` to choose an optimized `instanceCount`.
   * @param {Uint8Array} [glyphColors] - An array holding r,g,b values for each glyph.
   */
  updateGlyphs(
    glyphBounds,
    glyphAtlasIndices,
    totalBounds,
    chunkedBounds,
    glyphColors
  ) {
    // Update the instance attributes
    updateBufferAttr(this, glyphBoundsAttrName, glyphBounds, 4);
    updateBufferAttr(this, glyphIndexAttrName, glyphAtlasIndices, 1);
    updateBufferAttr(this, glyphColorAttrName, glyphColors, 3);
    this._chunkedBounds = chunkedBounds;
    setInstanceCount(this, glyphAtlasIndices.length);

    // Update the boundingSphere based on the total bounds
    const sphere = this.boundingSphere;
    sphere.center.set(
      (totalBounds[0] + totalBounds[2]) / 2,
      (totalBounds[1] + totalBounds[3]) / 2,
      0
    );
    sphere.radius = sphere.center.distanceTo(
      tempVec3.set(totalBounds[0], totalBounds[1], 0)
    );

    // Update the boundingBox based on the total bounds
    const box = this.boundingBox;
    // box.center.set(
    //   (totalBounds[0] + totalBounds[2]) / 2,
    //   (totalBounds[1] + totalBounds[3]) / 2,
    //   0
    // );]
    box.min = new Vector3(totalBounds[0], totalBounds[1], -10);
    box.max = new Vector3(totalBounds[2], totalBounds[3], 10);
  }

  /**
   * Given a clipping rect, and the chunkedBounds from the last updateGlyphs call, choose the lowest
   * `instanceCount` that will show all glyphs within the clipped view. This is an optimization
   * for long blocks of text that are clipped, to skip vertex shader evaluation for glyphs that would
   * be clipped anyway.
   *
   * Note that since `drawElementsInstanced[ANGLE]` only accepts an instance count and not a starting
   * offset, this optimization becomes less effective as the clipRect moves closer to the end of the
   * text block. We could fix that by switching from instancing to a full geometry with a drawRange,
   * but at the expense of much larger attribute buffers (see classdoc above.)
   *
   * @param {Vector4} clipRect
   */
  applyClipRect(clipRect) {
    let count = this.getAttribute(glyphIndexAttrName).count;
    let chunks = this._chunkedBounds;
    if (chunks) {
      for (let i = chunks.length; i--; ) {
        count = chunks[i].end;
        let rect = chunks[i].rect;
        // note: both rects are l-b-r-t
        if (
          rect[1] < clipRect.w &&
          rect[3] > clipRect.y &&
          rect[0] < clipRect.z &&
          rect[2] > clipRect.x
        ) {
          break;
        }
      }
    }
    setInstanceCount(this, count);
  }
}

// Compat for pre r109:
if (!GlyphsGeometry.prototype.setAttribute) {
  GlyphsGeometry.prototype.setAttribute = function (name, attribute) {
    this.attributes[name] = attribute;
    return this;
  };
}

function updateBufferAttr(geom, attrName, newArray, itemSize) {
  const attr = geom.getAttribute(attrName);
  if (newArray) {
    // If length isn't changing, just update the attribute's array data
    if (attr && attr.array.length === newArray.length) {
      attr.array.set(newArray);
      attr.needsUpdate = true;
    } else {
      geom.setAttribute(
        attrName,
        new InstancedBufferAttribute(newArray, itemSize)
      );
      // If the new attribute has a different size, we also have to (as of r117) manually clear the
      // internal cached max instance count. See https://github.com/mrdoob/three.js/issues/19706
      // It's unclear if this is a threejs bug or a truly unsupported scenario; discussion in
      // that ticket is ambiguous as to whether replacing a BufferAttribute with one of a
      // different size is supported, but https://github.com/mrdoob/three.js/pull/17418 strongly
      // implies it should be supported. It's possible we need to
      delete geom._maxInstanceCount; //for r117+, could be fragile
      geom.dispose(); //for r118+, more robust feeling, but more heavy-handed than I'd like
    }
  } else if (attr) {
    geom.deleteAttribute(attrName);
  }
}

// Handle maxInstancedCount -> instanceCount rename that happened in three r117
function setInstanceCount(geom, count) {
  geom[
    geom.hasOwnProperty("instanceCount") ? "instanceCount" : "maxInstancedCount"
  ] = count;
}

// language=GLSL
const VERTEX_DEFS = `
uniform vec2 uTroikaSDFTextureSize;
uniform float uTroikaSDFGlyphSize;
uniform vec4 uTroikaTotalBounds;
uniform vec4 uTroikaClipRect;
uniform mat3 uTroikaOrient;
uniform bool uTroikaUseGlyphColors;
attribute vec4 aTroikaGlyphBounds;
attribute float aTroikaGlyphIndex;
attribute vec3 aTroikaGlyphColor;
varying vec2 vTroikaSDFTextureUV;
varying vec2 vTroikaGlyphUV;
varying vec3 vTroikaGlyphColor;
`;

// language=GLSL prefix="void main() {" suffix="}"
const VERTEX_TRANSFORM = `
vec4 bounds = aTroikaGlyphBounds;
vec4 clippedBounds = vec4(
  clamp(bounds.xy, uTroikaClipRect.xy, uTroikaClipRect.zw),
  clamp(bounds.zw, uTroikaClipRect.xy, uTroikaClipRect.zw)
);
vec2 clippedXY = (mix(clippedBounds.xy, clippedBounds.zw, position.xy) - bounds.xy) / (bounds.zw - bounds.xy);
vTroikaGlyphUV = clippedXY.xy;

float cols = uTroikaSDFTextureSize.x / uTroikaSDFGlyphSize;
vTroikaSDFTextureUV = vec2(
  mod(aTroikaGlyphIndex, cols) + clippedXY.x,
  floor(aTroikaGlyphIndex / cols) + clippedXY.y
) * uTroikaSDFGlyphSize / uTroikaSDFTextureSize;

position.xy = mix(bounds.xy, bounds.zw, clippedXY);

uv = vec2(
  (position.x - uTroikaTotalBounds.x) / (uTroikaTotalBounds.z - uTroikaTotalBounds.x),
  (position.y - uTroikaTotalBounds.y) / (uTroikaTotalBounds.w - uTroikaTotalBounds.y)
);

position = uTroikaOrient * position;
normal = uTroikaOrient * normal;
`;

// language=GLSL
const FRAGMENT_DEFS = `
uniform sampler2D uTroikaSDFTexture;
uniform float uTroikaSDFMinDistancePct;
uniform bool uTroikaSDFDebug;
varying vec2 vTroikaSDFTextureUV;
varying vec2 vTroikaGlyphUV;

float troikaGetTextAlpha() {
  float troikaSDFValue = texture2D(uTroikaSDFTexture, vTroikaSDFTextureUV).r;
  
  #if defined(IS_DEPTH_MATERIAL) || defined(IS_DISTANCE_MATERIAL)
  float alpha = step(0.5, troikaSDFValue);
  #else
  ${''/*
    When the standard derivatives extension is available, we choose an antialiasing alpha threshold based
    on the potential change in the SDF's alpha from this fragment to its neighbor. This strategy maximizes 
    readability and edge crispness at all sizes and screen resolutions. Interestingly, this also means that 
    below a minimum size we're effectively displaying the SDF texture unmodified.
  */}
  #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  float aaDist = min(
    0.5,
    0.5 * min(
      fwidth(vTroikaGlyphUV.x),
      fwidth(vTroikaGlyphUV.y)
    )
  ) / uTroikaSDFMinDistancePct;
  #else
  float aaDist = 0.01;
  #endif
  
  float alpha = uTroikaSDFDebug ? troikaSDFValue : smoothstep(
    0.5 - aaDist,
    0.5 + aaDist,
    troikaSDFValue
  );
  #endif
  
  return alpha;
}
`;

// language=GLSL prefix="void main() {" suffix="}"
const FRAGMENT_TRANSFORM = `
float troikaAlphaMult = troikaGetTextAlpha();
if (troikaAlphaMult == 0.0) {
  discard;
} else {
  gl_FragColor.a *= troikaAlphaMult;
}
`;


/**
 * Create a material for rendering text, derived from a baseMaterial
 */
function createTextDerivedMaterial(baseMaterial) {
  const textMaterial = createDerivedMaterial(baseMaterial, {
    extensions: {derivatives: true},
    uniforms: {
      uTroikaSDFTexture: {value: null},
      uTroikaSDFTextureSize: {value: new Vector2()},
      uTroikaSDFGlyphSize: {value: 0},
      uTroikaSDFMinDistancePct: {value: 0},
      uTroikaTotalBounds: {value: new Vector4(0,0,0,0)},
      uTroikaClipRect: {value: new Vector4(0,0,0,0)},
      uTroikaOrient: {value: new Matrix3()},
      uTroikaUseGlyphColors: {value: true},
      uTroikaSDFDebug: {value: false}
    },
    vertexDefs: VERTEX_DEFS,
    vertexTransform: VERTEX_TRANSFORM,
    fragmentDefs: FRAGMENT_DEFS,
    fragmentColorTransform: FRAGMENT_TRANSFORM,
    customRewriter({vertexShader, fragmentShader}) {
      let uDiffuseRE = /\buniform\s+vec3\s+diffuse\b/;
      if (uDiffuseRE.test(fragmentShader)) {
        // Replace all instances of `diffuse` with our varying
        fragmentShader = fragmentShader
          .replace(uDiffuseRE, 'varying vec3 vTroikaGlyphColor')
          .replace(/\bdiffuse\b/g, 'vTroikaGlyphColor');
        // Make sure the vertex shader declares the uniform so we can grab it as a fallback
        if (!uDiffuseRE.test(vertexShader)) {
          vertexShader = vertexShader.replace(
            voidMainRegExp,
            'uniform vec3 diffuse;\n$&\nvTroikaGlyphColor = uTroikaUseGlyphColors ? aTroikaGlyphColor / 255.0 : diffuse;\n'
          );
        }
      }
      return { vertexShader, fragmentShader }
    }
  });

  // Force transparency - TODO is this reasonable?
  textMaterial.transparent = true;

  Object.defineProperties(textMaterial, {
    isTroikaTextMaterial: {value: true},

    // WebGLShadowMap reverses the side of the shadow material by default, which fails
    // for planes, so here we force the `shadowSide` to always match the main side.
    shadowSide: {
      get() {
        return this.side
      },
      set() {
        //no-op
      }
    }
  });

  return textMaterial
}

const defaultMaterial = new MeshBasicMaterial({
  color: 0xffffff,
  side: DoubleSide,
  transparent: true
});

const tempMat4 = new Matrix4();
const tempVec3a = new Vector3();
const tempVec3b = new Vector3();
const tempArray = [];
const origin = new Vector3();
const defaultOrient = '+x+y';

const raycastMesh = new Mesh(
  new PlaneBufferGeometry(1, 1).translate(0.5, 0.5, 0),
  defaultMaterial
);

const syncStartEvent = {type: 'syncstart'};
const syncCompleteEvent = {type: 'synccomplete'};

const SYNCABLE_PROPS = [
  'font',
  'fontSize',
  'letterSpacing',
  'lineHeight',
  'maxWidth',
  'overflowWrap',
  'text',
  'textAlign',
  'textIndent',
  'whiteSpace',
  'anchorX',
  'anchorY',
  'colorRanges',
  'sdfGlyphSize'
];

const COPYABLE_PROPS = SYNCABLE_PROPS.concat(
  'material',
  'color',
  'depthOffset',
  'clipRect',
  'orientation',
  'glyphGeometryDetail'
);



/**
 * @class Text
 *
 * 一个ThreeJS网格，使用带符号的距离在3D空间的平面上呈现一串文本
 * fields (SDF).
 */
class Text extends Mesh {
  constructor() {
    const geometry = new GlyphsGeometry();
    super(geometry, null);

    // === Text layout properties: === //

    /**
     * @member {string} text
     * The string of text to be rendered.
     */
    this.text = '';

    /**
     * @member {number|string} anchorX
     * Defines the horizontal position in the text block that should line up with the local origin.
     * Can be specified as a numeric x position in local units, a string percentage of the total
     * text block width e.g. `'25%'`, or one of the following keyword strings: 'left', 'center',
     * or 'right'.
     */
    this.anchorX = 0;

    /**
     * @member {number|string} anchorX
     * Defines the vertical position in the text block that should line up with the local origin.
     * Can be specified as a numeric y position in local units (note: down is negative y), a string
     * percentage of the total text block height e.g. `'25%'`, or one of the following keyword strings:
     * 'top', 'top-baseline', 'middle', 'bottom-baseline', or 'bottom'.
     */
    this.anchorY = 0;

    /**
     * @member {string} font
     * 要使用的自定义字体的URL。字体文件可以是OpenType支持的任何格式（请参见https://github.com/opentypejs/opentype.js).
     * 默认为从Google字体加载的Roboto字体.
     */
    this.font = null; //will use default from TextBuilder

    /**
     * @member {number} fontSize
     * The size at which to render the font in local units; corresponds to the em-box height
     * of the chosen `font`.
     */
    this.fontSize = 0.1;

    /**
     * @member {number} letterSpacing
     * Sets a uniform adjustment to spacing between letters after kerning is applied. Positive
     * numbers increase spacing and negative numbers decrease it.
     */
    this.letterSpacing = 0;

    /**
     * @member {number|string} lineHeight
     * Sets the height of each line of text, as a multiple of the `fontSize`. Defaults to 'normal'
     * which chooses a reasonable height based on the chosen font's ascender/descender metrics.
     */
    this.lineHeight = 'normal';

    /**
     * @member {number} maxWidth
     * The maximum width of the text block, above which text may start wrapping according to the
     * `whiteSpace` and `overflowWrap` properties.
     */
    this.maxWidth = Infinity;

    /**
     * @member {string} overflowWrap
     * Defines how text wraps if the `whiteSpace` property is `normal`. Can be either `'normal'`
     * to break at whitespace characters, or `'break-word'` to allow breaking within words.
     * Defaults to `'normal'`.
     */
    this.overflowWrap = 'normal';

    /**
     * @member {string} textAlign
     * The horizontal alignment of each line of text within the overall text bounding box.
     */
    this.textAlign = 'left';

    /**
     * @member {number} textIndent
     * Indentation for the first character of a line; see CSS `text-indent`.
     */
    this.textIndent = 0;

    /**
     * @member {string} whiteSpace
     * Defines whether text should wrap when a line reaches the `maxWidth`. Can
     * be either `'normal'` (the default), to allow wrapping according to the `overflowWrap` property,
     * or `'nowrap'` to prevent wrapping. Note that `'normal'` here honors newline characters to
     * manually break lines, making it behave more like `'pre-wrap'` does in CSS.
     */
    this.whiteSpace = 'normal';

    // === Presentation properties: === //

    /**
     * @member {THREE.Material} material
     * Defines a _base_ material to be used when rendering the text. This material will be
     * automatically replaced with a material derived from it, that adds shader code to
     * decrease the alpha for each fragment (pixel) outside the text glyphs, with antialiasing.
     * By default it will derive from a simple white MeshBasicMaterial, but you can use any
     * of the other mesh materials to gain other features like lighting, texture maps, etc.
     *
     * Also see the `color` shortcut property.
     */
    this.material = null;

    /**
     * @member {string|number|THREE.Color} color
     * This is a shortcut for setting the `color` of the text's material. You can use this
     * if you don't want to specify a whole custom `material`.
     */
    this.color = null;

    /**
     * @member {object|null} colorRanges
     * WARNING: This API is experimental and may change.
     * This allows more fine-grained control of colors for individual or ranges of characters,
     * taking precedence over the material's `color`. Its format is an Object whose keys each
     * define a starting character index for a range, and whose values are the color for each
     * range. The color value can be a numeric hex color value, a `THREE.Color` object, or
     * any of the strings accepted by `THREE.Color`.
     */
    this.colorRanges = null;

    /**
     * @member {number} depthOffset
     * This is a shortcut for setting the material's `polygonOffset` and related properties,
     * which can be useful in preventing z-fighting when this text is laid on top of another
     * plane in the scene. Positive numbers are further from the camera, negatives closer.
     */
    this.depthOffset = 0;

    /**
     * @member {Array<number>} clipRect
     * If specified, defines a `[minX, minY, maxX, maxY]` of a rectangle outside of which all
     * pixels will be discarded. This can be used for example to clip overflowing text when
     * `whiteSpace='nowrap'`.
     */
    this.clipRect = null;

    /**
     * @member {string} orientation
     * Defines the axis plane on which the text should be laid out when the mesh has no extra
     * rotation transform. It is specified as a string with two axes: the horizontal axis with
     * positive pointing right, and the vertical axis with positive pointing up. By default this
     * is '+x+y', meaning the text sits on the xy plane with the text's top toward positive y
     * and facing positive z. A value of '+x-z' would place it on the xz plane with the text's
     * top toward negative z and facing positive y.
     */
    this.orientation = defaultOrient;

    /**
     * @member {number} glyphGeometryDetail
     * Controls number of vertical/horizontal segments that make up each glyph's rectangular
     * plane. Defaults to 1. This can be increased to provide more geometrical detail for custom
     * vertex shader effects, for example.
     */
    this.glyphGeometryDetail = 1;

    /**
     * @member {number|null} sdfGlyphSize
     * The size of each glyph's SDF (signed distance field) used for rendering. This must be a
     * power-of-two number. Defaults to 64 which is generally a good balance of size and quality
     * for most fonts. Larger sizes can improve the quality of glyph rendering by increasing
     * the sharpness of corners and preventing loss of very thin lines, at the expense of
     * increased memory footprint and longer SDF generation time.
     */
    this.sdfGlyphSize = null;

    this.debugSDF = false;
  }

  /**
   * 根据当前与文本相关的配置属性更新文本呈现.
   * 这是一个异步进程，所以你可以传入一个回调函数，当它完成时执行。
   * @param {function} [callback]
   */
  sync(callback) {
    if (this._needsSync) {
      //console.log('syncing text', this.text)
      this._needsSync = false;

      // 如果有另一个同步仍在进行中，排队等待它完成
      if (this._isSyncing) {
        (this._queuedSyncs || (this._queuedSyncs = [])).push(callback);
      } else {
        this._isSyncing = true;
        this.dispatchEvent(syncStartEvent);

        getTextRenderInfo({
          text: this.text,
          font: this.font,
          fontSize: this.fontSize || 0.1,
          letterSpacing: this.letterSpacing || 0,
          lineHeight: this.lineHeight || 'normal',
          maxWidth: this.maxWidth,
          textAlign: this.textAlign,
          textIndent: this.textIndent,
          whiteSpace: this.whiteSpace,
          overflowWrap: this.overflowWrap,
          anchorX: this.anchorX,
          anchorY: this.anchorY,
          colorRanges: this.colorRanges,
          includeCaretPositions: true, //TODO parameterize
          sdfGlyphSize: this.sdfGlyphSize
        }, textRenderInfo => {
          this._isSyncing = false;

          // 在onBeforeRender中保存结果以供以后使用
          this._textRenderInfo = textRenderInfo;

          // 更新几何属性
          this.geometry.updateGlyphs(
            textRenderInfo.glyphBounds,
            textRenderInfo.glyphAtlasIndices,
            textRenderInfo.totalBounds,
            textRenderInfo.chunkedBounds,
            textRenderInfo.glyphColors
          );

          // 如果我们有额外的同步请求排队，启动它
          const queued = this._queuedSyncs;
          if (queued) {
            this._queuedSyncs = null;
            this._needsSync = true;
            this.sync(() => {
              queued.forEach(fn => fn && fn());
            });
          }

          this.dispatchEvent(syncCompleteEvent);
          if (callback) {
            callback();
          }
        });
      }
    }
  }

  /**
   * Initiate a sync if needed - note it won't complete until next frame at the
   * earliest so if possible it's a good idea to call sync() manually as soon as
   * all the properties have been set.
   * @override
   */
  onBeforeRender() {
    this.sync();
    this._prepareForRender();
  }

  /**
   * Shortcut to dispose the geometry specific to this instance.
   * Note: we don't also dispose the derived material here because if anything else is
   * sharing the same base material it will result in a pause next frame as the program
   * is recompiled. Instead users can dispose the base material manually, like normal,
   * and we'll also dispose the derived material at that time.
   */
  dispose() {
    this.geometry.dispose();
  }

  /**
   * @property {TroikaTextRenderInfo|null} textRenderInfo
   * @readonly
   * The current processed rendering data for this TextMesh, returned by the TextBuilder after
   * a `sync()` call. This will be `null` initially, and may be stale for a short period until
   * the asynchrous `sync()` process completes.
   */
  get textRenderInfo() {
    return this._textRenderInfo || null
  }

  // Handler for automatically wrapping the base material with our upgrades. We do the wrapping
  // lazily on _read_ rather than write to avoid unnecessary wrapping on transient values.
  get material() {
    let derivedMaterial = this._derivedMaterial;
    const baseMaterial = this._baseMaterial || defaultMaterial;
    if (!derivedMaterial || derivedMaterial.baseMaterial !== baseMaterial) {
      derivedMaterial = this._derivedMaterial = createTextDerivedMaterial(baseMaterial);
      // dispose the derived material when its base material is disposed:
      baseMaterial.addEventListener('dispose', function onDispose() {
        baseMaterial.removeEventListener('dispose', onDispose);
        derivedMaterial.dispose();
      });
    }
    return derivedMaterial
  }
  set material(baseMaterial) {
    if (baseMaterial && baseMaterial.isTroikaTextMaterial) { //prevent double-derivation
      this._derivedMaterial = baseMaterial;
      this._baseMaterial = baseMaterial.baseMaterial;
    } else {
      this._baseMaterial = baseMaterial;
    }
  }

  get glyphGeometryDetail() {
    return this.geometry.detail
  }
  set glyphGeometryDetail(detail) {
    this.geometry.detail = detail;
  }

  // Create and update material for shadows upon request:
  get customDepthMaterial() {
    return this.material.getDepthMaterial()
  }
  get customDistanceMaterial() {
    return this.material.getDistanceMaterial()
  }

  _prepareForRender() {
    const material = this._derivedMaterial;
    const uniforms = material.uniforms;
    const textInfo = this.textRenderInfo;
    if (textInfo) {
      const {sdfTexture, totalBounds} = textInfo;
      uniforms.uTroikaSDFTexture.value = sdfTexture;
      uniforms.uTroikaSDFTextureSize.value.set(sdfTexture.image.width, sdfTexture.image.height);
      uniforms.uTroikaSDFGlyphSize.value = textInfo.sdfGlyphSize;
      uniforms.uTroikaSDFMinDistancePct.value = textInfo.sdfMinDistancePercent;
      uniforms.uTroikaTotalBounds.value.fromArray(totalBounds);
      uniforms.uTroikaUseGlyphColors.value = !!textInfo.glyphColors;

      let clipRect = this.clipRect;
      if (!(clipRect && Array.isArray(clipRect) && clipRect.length === 4)) {
        uniforms.uTroikaClipRect.value.fromArray(totalBounds);
      } else {
        uniforms.uTroikaClipRect.value.set(
          Math.max(totalBounds[0], clipRect[0]),
          Math.max(totalBounds[1], clipRect[1]),
          Math.min(totalBounds[2], clipRect[2]),
          Math.min(totalBounds[3], clipRect[3])
        );
      }
      this.geometry.applyClipRect(uniforms.uTroikaClipRect.value);
    }
    uniforms.uTroikaSDFDebug.value = !!this.debugSDF;
    material.polygonOffset = !!this.depthOffset;
    material.polygonOffsetFactor = material.polygonOffsetUnits = this.depthOffset || 0;

    // 通过网格上的"颜色"道具设置材料颜色的快捷方式:
    const color = this.color;
    if (color != null && material.color && material.color.isColor && color !== material._troikaColor) {
      material.color.set(material._troikaColor = color);
    }

    // base orientation
    let orient = this.orientation || defaultOrient;
    if (orient !== material._orientation) {
      let rotMat = uniforms.uTroikaOrient.value;
      orient = orient.replace(/[^-+xyz]/g, '');
      let match = orient !== defaultOrient && orient.match(/^([-+])([xyz])([-+])([xyz])$/);
      if (match) {
        let [, hSign, hAxis, vSign, vAxis] = match;
        tempVec3a.set(0, 0, 0)[hAxis] = hSign === '-' ? 1 : -1;
        tempVec3b.set(0, 0, 0)[vAxis] = vSign === '-' ? -1 : 1;
        tempMat4.lookAt(origin, tempVec3a.cross(tempVec3b), tempVec3b);
        rotMat.setFromMatrix4(tempMat4);
      } else {
        rotMat.identity();
      }
      material._orientation = orient;
    }
  }

  /**
   * @override Custom raycasting to test against the whole text block's max rectangular bounds
   * TODO is there any reason to make this more granular, like within individual line or glyph rects?
   */
  raycast(raycaster, intersects) {
    const textInfo = this.textRenderInfo;
    if (textInfo) {
      const bounds = textInfo.totalBounds;
      raycastMesh.matrixWorld.multiplyMatrices(
        this.matrixWorld,
        tempMat4.set(
          bounds[2] - bounds[0], 0, 0, bounds[0],
          0, bounds[3] - bounds[1], 0, bounds[1],
          0, 0, 1, 0,
          0, 0, 0, 1
        )
      );
      tempArray.length = 0;
      raycastMesh.raycast(raycaster, tempArray);
      for (let i = 0; i < tempArray.length; i++) {
        tempArray[i].object = this;
        intersects.push(tempArray[i]);
      }
    }
  }

  copy(source) {
    super.copy(source);
    COPYABLE_PROPS.forEach(prop => {
      this[prop] = source[prop];
    });
    return this
  }

  clone() {
    return new this.constructor().copy(this)
  }
}


// Create setters for properties that affect text layout:
SYNCABLE_PROPS.forEach(prop => {
  const privateKey = '_private_' + prop;
  Object.defineProperty(Text.prototype, prop, {
    get() {
      return this[privateKey]
    },
    set(value) {
      if (value !== this[privateKey]) {
        this[privateKey] = value;
        this._needsSync = true;
      }
    }
  });
});


// Deprecation handler for `anchor` array:
let deprMsgShown = false;
Object.defineProperty(Text.prototype, 'anchor', {
  get() {
    return this._deprecated_anchor
  },
  set(val) {
    this._deprecated_anchor = val;
    if (!deprMsgShown) {
      console.warn('TextMesh: `anchor` has been deprecated; use `anchorX` and `anchorY` instead.');
      deprMsgShown = true;
    }
    if (Array.isArray(val)) {
      this.anchorX = `${(+val[0] || 0) * 100}%`;
      this.anchorY = `${(+val[1] || 0) * 100}%`;
    } else {
      this.anchorX = this.anchorY = 0;
    }
  }
});

//=== Utility functions for dealing with carets and selection ranges ===//

/**
 * @typedef {object} TextCaret
 * @property {number} x - x position of the caret
 * @property {number} y - y position of the caret's bottom
 * @property {number} height - height of the caret
 * @property {number} charIndex - the index in the original input string of this caret's target
 *   character; the caret will be for the position _before_ that character.
 */

/**
 * Given a local x/y coordinate in the text block plane, find the nearest caret position.
 * @param {TroikaTextRenderInfo} textRenderInfo - a result object from TextBuilder#getTextRenderInfo
 * @param {number} x
 * @param {number} y
 * @return {TextCaret | null}
 */
function getCaretAtPoint(textRenderInfo, x, y) {
  let closestCaret = null;
  const {caretHeight} = textRenderInfo;
  const caretsByRow = groupCaretsByRow(textRenderInfo);

  // Find nearest row by y first
  let closestRowY = Infinity;
  caretsByRow.forEach((carets, rowY) => {
    if (Math.abs(y - (rowY + caretHeight / 2)) < Math.abs(y - (closestRowY + caretHeight / 2))) {
      closestRowY = rowY;
    }
  });

  // Then find closest caret by x within that row
  caretsByRow.get(closestRowY).forEach(caret => {
    if (!closestCaret || Math.abs(x - caret.x) < Math.abs(x - closestCaret.x)) {
      closestCaret = caret;
    }
  });
  return closestCaret
}


const _rectsCache = new WeakMap();

/**
 * Given start and end character indexes, return a list of rectangles covering all the
 * characters within that selection.
 * @param {TroikaTextRenderInfo} textRenderInfo
 * @param {number} start - index of the first char in the selection
 * @param {number} end - index of the first char after the selection
 * @return {Array<{left, top, right, bottom}> | null}
 */
function getSelectionRects(textRenderInfo, start, end) {
  let rects;
  if (textRenderInfo) {
    // Check cache - textRenderInfo is frozen so it's safe to cache based on it
    let prevResult = _rectsCache.get(textRenderInfo);
    if (prevResult && prevResult.start === start && prevResult.end === end) {
      return prevResult.rects
    }

    const {caretPositions, caretHeight, totalBounds} = textRenderInfo;

    // Normalize
    if (end < start) {
      const s = start;
      start = end;
      end = s;
    }
    start = Math.max(start, 0);
    end = Math.min(end, caretPositions.length + 1);

    // Collect into one rect per row
    let rows = new Map();
    for (let i = start; i < end; i++) {
      const x1 = caretPositions[i * 3];
      const x2 = caretPositions[i * 3 + 1];
      const y = caretPositions[i * 3 + 2];
      let row = rows.get(y);
      if (!row) {
        row = {left: x1, right: x2, bottom: y, top: y + caretHeight};
        rows.set(y, row);
      } else {
        row.left = Math.max(Math.min(row.left, x1), totalBounds[0]);
        row.right = Math.min(Math.max(row.right, x2), totalBounds[2]);
      }
    }
    rects = [];
    rows.forEach(rect => {
      rects.push(rect);
    });

    _rectsCache.set(textRenderInfo, {start, end, rects});
  }
  return rects
}

const _caretsByRowCache = new WeakMap();

function groupCaretsByRow(textRenderInfo) {
  // textRenderInfo is frozen so it's safe to cache based on it
  let caretsByRow = _caretsByRowCache.get(textRenderInfo);
  if (!caretsByRow) {
    const {caretPositions, caretHeight} = textRenderInfo;
    caretsByRow = new Map();
    for (let i = 0; i < caretPositions.length; i += 3) {
      const rowY = caretPositions[i + 2];
      let rowCarets = caretsByRow.get(rowY);
      if (!rowCarets) {
        caretsByRow.set(rowY, rowCarets = []);
      }
      rowCarets.push({
        x: caretPositions[i],
        y: rowY,
        height: caretHeight,
        charIndex: i / 3
      });
      // Add one more caret after the final char
      if (i + 3 >= caretPositions.length) {
        rowCarets.push({
          x: caretPositions[i + 1],
          y: rowY,
          height: caretHeight,
          charIndex: i / 3 + 1
        });
      }
    }
  }
  _caretsByRowCache.set(textRenderInfo, caretsByRow);
  return caretsByRow
}

export { GlyphsGeometry, Text, configureTextBuilder, createTextDerivedMaterial, fontProcessorWorkerModule, getCaretAtPoint, getSelectionRects, preloadFont };

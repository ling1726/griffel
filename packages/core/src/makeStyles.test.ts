import { RESET } from './constants';
import { createDOMRenderer } from './renderer/createDOMRenderer';
import { griffelRendererSerializer } from './common/snapshotSerializers';
import { makeStyles } from './makeStyles';
import type { GriffelInsertionFactory, GriffelRenderer } from './types';

expect.addSnapshotSerializer(griffelRendererSerializer);

describe('makeStyles', () => {
  let renderer: GriffelRenderer;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    renderer = createDOMRenderer(document);
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('returns an empty classname for an empty style set', () => {
    const computeClasses = makeStyles({
      root: {},
    });
    expect(computeClasses({ dir: 'ltr', renderer }).root).toEqual('');
  });

  it('returns a single classname for a single style', () => {
    const computeClasses = makeStyles({
      root: {
        color: 'red',
      },
    });
    expect(computeClasses({ dir: 'ltr', renderer }).root).toEqual('___afhpfp0 fe3e8s9');

    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .fe3e8s9 {
        color: red;
      }
    `);
  });

  it('returns multiple classnames for complex rules', () => {
    const computeClasses = makeStyles({
      root: {
        color: 'red',
        position: 'absolute',
        ':hover': { color: 'blue' },
      },
    });

    expect(computeClasses({ dir: 'ltr', renderer }).root).toEqual('___20fshm0 fe3e8s9 f1euv43f f10q6zxg');
    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .fe3e8s9 {
        color: red;
      }
      .f1euv43f {
        position: absolute;
      }
      /** bucket "h" {"data-priority":"0"} **/
      .f10q6zxg:hover {
        color: blue;
      }
    `);
  });

  it('works with CSS shorthands', () => {
    const computeClasses = makeStyles({
      root: {
        backgroundColor: 'red',
        border: '3px solid black',
        padding: '10px',
      },
    });

    expect(computeClasses({ dir: 'ltr', renderer }).root).toMatchInlineSnapshot(`"___1vg1v8m f3xbvq9 f4wmytw fbhmu18"`);
    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .f3xbvq9 {
        background-color: red;
      }
      /** bucket "d" {"data-priority":"-2"} **/
      .f4wmytw {
        border: 3px solid black;
      }
      /** bucket "d" {"data-priority":"-1"} **/
      .fbhmu18 {
        padding: 10px;
      }
    `);
  });

  it('handles RTL for styles', () => {
    const computeClasses = makeStyles({
      root: {
        paddingLeft: '10px',
        borderLeftWidth: '10px',
      },
    });

    const ltrClasses = computeClasses({ dir: 'ltr', renderer }).root;
    const rtlClasses = computeClasses({ dir: 'rtl', renderer }).root;

    expect(ltrClasses).toEqual('___a0zqzs0 frdkuqy f1c8chgj');
    expect(rtlClasses).toEqual('___7x57i00 f81rol6 f19krssl');

    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .frdkuqy {
        padding-left: 10px;
      }
      .f81rol6 {
        padding-right: 10px;
      }
      .f1c8chgj {
        border-left-width: 10px;
      }
      .f19krssl {
        border-right-width: 10px;
      }
    `);
  });

  it('handles RTL for keyframes', () => {
    const computeClasses = makeStyles({
      root: {
        animationName: {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        animationIterationCount: 'infinite',
        animationDuration: '5s',
      },
    });
    expect(computeClasses({ dir: 'rtl', renderer }).root).toBe('___3kh5ri0 f1fp4ujf f1cpbl36 f1t9cprh');

    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "k" {"data-priority":"0"} **/
      @keyframes f1q8eu9e {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes f55c0se {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(-360deg);
        }
      }
      /** bucket "d" {"data-priority":"0"} **/
      .f1g6ul6r {
        animation-name: f1q8eu9e;
      }
      .f1fp4ujf {
        animation-name: f55c0se;
      }
      .f1cpbl36 {
        animation-iteration-count: infinite;
      }
      .f1t9cprh {
        animation-duration: 5s;
      }
    `);
  });

  it('handles multiple renderers', () => {
    const rendererA = createDOMRenderer();
    const rendererB = createDOMRenderer();

    const computeClasses = makeStyles({
      root: { display: 'flex', paddingLeft: '10px' },
    });

    const classesA = computeClasses({ dir: 'rtl', renderer: rendererA }).root;
    const classesB = computeClasses({ dir: 'rtl', renderer: rendererB }).root;

    // Classes emitted by different renderers can be the same
    expect(classesA).toBe(classesB);
    // Style elements should be different for different renderers
    expect(rendererA.stylesheets['d0']).toBeInstanceOf(Object);
    expect(rendererB.stylesheets['d0']).toBeInstanceOf(Object);

    expect(Object.keys(rendererA.stylesheets)).toEqual(Object.keys(rendererB.stylesheets));
    expect(rendererA.stylesheets['d0']).not.toBe(rendererB.stylesheets['d0']);

    expect(rendererA).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .f22iagw {
        display: flex;
      }
      .frdkuqy {
        padding-left: 10px;
      }
      .f81rol6 {
        padding-right: 10px;
      }
    `);
    expect(rendererB).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .f22iagw {
        display: flex;
      }
      .frdkuqy {
        padding-left: 10px;
      }
      .f81rol6 {
        padding-right: 10px;
      }
    `);
  });

  it('works with insertionFactory', () => {
    const insertionFactory: GriffelInsertionFactory = () => {
      return function (renderer, cssRulesByBucket) {
        renderer.insertCSSRules(cssRulesByBucket);
      };
    };
    const renderer: Partial<GriffelRenderer> = { insertCSSRules: jest.fn() };

    const computeClasses = makeStyles(
      {
        root: { display: 'flex', paddingLeft: '10px' },
      },
      insertionFactory,
    );
    const classes = computeClasses({ dir: 'ltr', renderer: renderer as GriffelRenderer }).root;

    expect(classes).toMatchInlineSnapshot(`"___qs05so0 f22iagw frdkuqy"`);

    expect(renderer.insertCSSRules).toHaveBeenCalledTimes(1);
    expect(renderer.insertCSSRules).toHaveBeenCalledWith({
      d: ['.f22iagw{display:flex;}', '.frdkuqy{padding-left:10px;}', '.f81rol6{padding-right:10px;}'],
    });
  });

  it('handles numeric slot names', () => {
    const computeClasses = makeStyles({
      42: {
        color: 'red',
      },
    });
    expect(computeClasses({ dir: 'ltr', renderer })[42]).toEqual('___afhpfp0 fe3e8s9');

    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .fe3e8s9 {
        color: red;
      }
    `);
  });

  it('handles "RESET" for rules removal', () => {
    const computeClassesA = makeStyles({ root: { color: RESET } });
    const computeClassesB = makeStyles({ root: { backgroundColor: RESET } });
    const computeClassesC = makeStyles({ root: { color: RESET, backgroundColor: '10px' } });

    expect(computeClassesA({ dir: 'ltr', renderer }).root).toEqual('___1oss4e0');
    expect(computeClassesB({ dir: 'ltr', renderer }).root).toEqual('___wi64bx0');
    expect(computeClassesC({ dir: 'ltr', renderer }).root).toEqual('___1919hol fihdeyh');

    expect(renderer).toMatchInlineSnapshot(`
      /** bucket "d" {"data-priority":"0"} **/
      .fihdeyh {
        background-color: 10px;
      }
    `);
  });

  describe('classNameHashSalt', () => {
    it('applies a salt to the hash', () => {
      const rendererWithSalt = createDOMRenderer(document, { classNameHashSalt: 'salt' });

      const computeClassesWithSalt = makeStyles({ root: { color: 'red' } });
      const computeClassesWithoutSalt = makeStyles({ root: { color: 'red' } });

      const resultWithSalt = computeClassesWithSalt({ dir: 'ltr', renderer }).root;
      const resultWithoutSalt = computeClassesWithoutSalt({ dir: 'ltr', renderer: rendererWithSalt }).root;

      expect(resultWithSalt).toMatchInlineSnapshot(`"___afhpfp0 fe3e8s9"`);
      expect(resultWithoutSalt).toMatchInlineSnapshot(`"___eoxc7a0 fl2dfm4"`);

      expect(resultWithSalt).not.toBe(resultWithoutSalt);
    });
  });

  it.each<'test' | 'development'>(['test', 'development'])(
    'in non-production mode, hashes include debug information',
    env => {
      process.env.NODE_ENV = env;
      const computeClasses = makeStyles({
        root: { color: 'red' },
      });

      expect(computeClasses({ dir: 'ltr', renderer }).root).toEqual('___afhpfp0_0000000 fe3e8s9');
    },
  );
});

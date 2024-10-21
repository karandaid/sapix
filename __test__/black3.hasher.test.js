import Blake2Hasher from '../lib/utils/blake3_hasher.mjs';

describe('Blake2Hasher', () => {
  let hasher;

  beforeEach(() => {
    hasher = new Blake2Hasher({ algorithm: 'blake2b', digestLength: 64 });
  });

  const data = {
    number: 123,
    string: "Hello, World!",
    boolean: true,
    array: [1, 2, 3],
    object: { a: 1, b: 2 },
    map: new Map([['key1', 'value1'], ['key2', 'value2']]),
    set: new Set([1, 2, 3]),
    func: function greet() { return "Hi"; },
    classInstance: new (class Person {
      constructor(name) {
        this.name = name;
        this.age = 30;
      }
    })('Alice'),
    nestedObject: {
      nestedArray: [1, 2, { key: 'value' }],
      anotherObject: { x: 10, y: 20 },
    },
  };

  test('should hash number correctly', () => {
    const hash = hasher.hash(data.number);
    expect(hash).toBe('e64cb91c7c1819bdcda4dca47a2aae98e737df75ddb0287083229dc0695064616df676a0c95ae55109fe0a27ba9dee79ea9a5c9d90cceb0cf8ae80b4f61ab4a3');
  });

  test('should hash string correctly', () => {
    const hash = hasher.hash(data.string);
    expect(hash).toBe('45668ffcb2547d330402baaf3b9d4240d01ad625c6e3c91a535cb7b433fa71eb849bd2448d5b1f267baa286cb77785449e3c565842cb56d3255a6585fadf8a73');
  });

  test('should hash boolean correctly', () => {
    const hash = hasher.hash(data.boolean);
    expect(hash).toBe('5c07e85b3afb949077f2fa42181bb0498f5945f2086d37df5676ebf424ec137d0c21292c943098e22914cdca350e9140d185ca1b2b2bf0522acfcdde09b395dd');
  });

  test('should hash array correctly', () => {
    const hash = hasher.hash(data.array);
    expect(hash).toBe('b1b267d1a37e4fe0ca3253fd9d8bb011f4df51f1f82d484d7136594fb8c8c5088452a42b9743766d4cfc57e3e91c02046d3a46e0b6d426f37ffd0be1b34b10a7');
  });

  test('should hash object correctly', () => {
    const hash = hasher.hash(data.object);
    expect(hash).toBe('bd77d3edda0b9ce9bbb3e9a2f4087e5bfd050676598a30f9b4611d935e5fe5b9a7d8454e0c307dfbba6890019dc8ae372e3259020ded5eb66d23d8e00a530e3a');
  });

  test('should hash map correctly', () => {
    const hash = hasher.hash(data.map);
    expect(hash).toBe('b9acfaab3f5072c8139c3005fb164d28bf1144804800974381e2218496ff352aa43ae5bfcd8bcc13b6e436b49029c76905f96815c8cb75561ce079e260cf72b3');
  });

  test('should hash set correctly', () => {
    const hash = hasher.hash(data.set);
    expect(hash).toBe('8ef5916b88bc6285f4ca5232f564e3c072fa0da4e4bfe4a7ae6e82cd60578f32b437d63d9a527efe72a9856cf8083e267de1af762ae6194df7edd77fd9eb757d');
  });

  test('should hash function correctly', () => {
    const hash = hasher.hash(data.func);
    expect(hash).toBe('8a280a8b39f8ac035436766fe831711820567014a4ae743f20dac305d50023b37510fa4ed9209106adb556a0b016c5addadae4e93e3708b5143dd4ea8ee0a008');
  });

  test('should hash class instance correctly', () => {
    const hash = hasher.hash(data.classInstance);
    expect(hash).toBe('26d6455a0ff46e1da92978d0c5745e6e137badfd4afaca60743ebb6efdc1806fd23f6a0150cf6de5f1d0602a7aa9cc6d386df3e13b8d1aa14afa098ec069adae');
  });

  test('should hash nested object correctly', () => {
    const hash = hasher.hash(data.nestedObject);
    expect(hash).toBe('55f13a9fbc4ce2e1657ad31ce46a934e50c49cec2e77a5c9ca54c48f556599aff1b3c3a942abd0254386924da7bc8778f429fa202d495e6c22d5989d76609322');
  });

  test('should hash the entire object correctly', () => {
    const hash = hasher.hash(data);
    expect(hash).toBe('5e599534ec70bb8cd672468825b9461c6a4c880b01566486fc92b825e2f5d9949207266e93918838e5af3d75cd200bdcbb324fe3a4d3ee0a3ab353ba494645d5');
  });
});

import type { PackageURL } from '../site/assets/js/types/registry-types';

/**
 * Test fixtures for PURL parsing and registry URL generation
 */

// Valid PURL test cases with expected parsed results
export interface ValidPurlTestCase {
  input: string;
  expected: PackageURL;
  expectedUrl: string | null;
  description: string;
}

export const validPurlTestCases: ValidPurlTestCase[] = [
  // npm
  {
    input: 'pkg:npm/lodash@4.17.21',
    expected: { type: 'npm', name: 'lodash', version: '4.17.21' },
    expectedUrl: 'https://www.npmjs.com/package/lodash/v/4.17.21',
    description: 'npm package with version'
  },
  {
    input: 'pkg:npm/lodash',
    expected: { type: 'npm', name: 'lodash' },
    expectedUrl: 'https://www.npmjs.com/package/lodash',
    description: 'npm package without version'
  },
  {
    input: 'pkg:npm/%40types/node@18.0.0',
    expected: { type: 'npm', name: 'node', namespace: '@types', version: '18.0.0' },
    expectedUrl: 'https://www.npmjs.com/package/@types/node/v/18.0.0',
    description: 'npm scoped package'
  },

  // pypi
  {
    input: 'pkg:pypi/requests@2.28.0',
    expected: { type: 'pypi', name: 'requests', version: '2.28.0' },
    expectedUrl: 'https://pypi.org/project/requests/2.28.0/',
    description: 'pypi package with version'
  },
  {
    input: 'pkg:pypi/Django',
    expected: { type: 'pypi', name: 'django' },
    expectedUrl: 'https://pypi.org/project/django/',
    description: 'pypi package without version (normalized to lowercase)'
  },

  // maven
  {
    input: 'pkg:maven/org.apache.commons/commons-lang3@3.12.0',
    expected: { type: 'maven', name: 'commons-lang3', namespace: 'org.apache.commons', version: '3.12.0' },
    expectedUrl: 'https://central.sonatype.com/artifact/org.apache.commons/commons-lang3/3.12.0',
    description: 'maven package with group and version'
  },
  {
    input: 'pkg:maven/org.apache.commons/commons-lang3',
    expected: { type: 'maven', name: 'commons-lang3', namespace: 'org.apache.commons' },
    expectedUrl: 'https://central.sonatype.com/artifact/org.apache.commons/commons-lang3',
    description: 'maven package without version'
  },

  // cargo
  {
    input: 'pkg:cargo/serde@1.0.152',
    expected: { type: 'cargo', name: 'serde', version: '1.0.152' },
    expectedUrl: 'https://crates.io/crates/serde/1.0.152',
    description: 'cargo crate with version'
  },

  // gem
  {
    input: 'pkg:gem/rails@7.0.4',
    expected: { type: 'gem', name: 'rails', version: '7.0.4' },
    expectedUrl: 'https://rubygems.org/gems/rails/versions/7.0.4',
    description: 'ruby gem with version'
  },

  // nuget
  {
    input: 'pkg:nuget/Newtonsoft.Json@13.0.1',
    expected: { type: 'nuget', name: 'Newtonsoft.Json', version: '13.0.1' },
    expectedUrl: 'https://www.nuget.org/packages/Newtonsoft.Json/13.0.1',
    description: 'nuget package with version'
  },

  // golang
  {
    input: 'pkg:golang/github.com/gin-gonic/gin@v1.9.0',
    expected: { type: 'golang', name: 'gin', namespace: 'github.com/gin-gonic', version: 'v1.9.0' },
    expectedUrl: 'https://pkg.go.dev/github.com/gin-gonic/gin@v1.9.0',
    description: 'golang module with version'
  },

  // docker
  {
    input: 'pkg:docker/library/nginx@1.23',
    expected: { type: 'docker', name: 'nginx', namespace: 'library', version: '1.23' },
    expectedUrl: 'https://hub.docker.com/_/nginx',
    description: 'docker official image'
  },
  {
    input: 'pkg:docker/bitnami/postgresql@15',
    expected: { type: 'docker', name: 'postgresql', namespace: 'bitnami', version: '15' },
    expectedUrl: 'https://hub.docker.com/r/bitnami/postgresql',
    description: 'docker non-official image'
  },

  // github
  {
    input: 'pkg:github/torvalds/linux',
    expected: { type: 'github', name: 'linux', namespace: 'torvalds' },
    expectedUrl: 'https://github.com/torvalds/linux',
    description: 'github repository'
  },

  // bitbucket
  {
    input: 'pkg:bitbucket/atlassian/aui',
    expected: { type: 'bitbucket', name: 'aui', namespace: 'atlassian' },
    expectedUrl: 'https://bitbucket.org/atlassian/aui',
    description: 'bitbucket repository'
  },

  // hex
  {
    input: 'pkg:hex/phoenix@1.7.0',
    expected: { type: 'hex', name: 'phoenix', version: '1.7.0' },
    expectedUrl: 'https://hex.pm/packages/phoenix/1.7.0',
    description: 'hex package with version'
  },

  // pub
  {
    input: 'pkg:pub/flutter',
    expected: { type: 'pub', name: 'flutter' },
    expectedUrl: 'https://pub.dev/packages/flutter',
    description: 'dart pub package'
  },

  // composer
  {
    input: 'pkg:composer/laravel/framework@10.0.0',
    expected: { type: 'composer', name: 'framework', namespace: 'laravel', version: '10.0.0' },
    expectedUrl: 'https://packagist.org/packages/laravel/framework',
    description: 'composer package'
  },

  // cocoapods
  {
    input: 'pkg:cocoapods/Alamofire@5.6.0',
    expected: { type: 'cocoapods', name: 'Alamofire', version: '5.6.0' },
    expectedUrl: 'https://cocoapods.org/pods/Alamofire',
    description: 'cocoapods pod'
  },

  // hackage
  {
    input: 'pkg:hackage/aeson@2.1.0.0',
    expected: { type: 'hackage', name: 'aeson', version: '2.1.0.0' },
    expectedUrl: 'https://hackage.haskell.org/package/aeson',
    description: 'hackage haskell package'
  },

  // cran
  {
    input: 'pkg:cran/ggplot2@3.4.0',
    expected: { type: 'cran', name: 'ggplot2', version: '3.4.0' },
    expectedUrl: 'https://cran.r-project.org/package=ggplot2',
    description: 'CRAN R package'
  },

  // cpan
  {
    input: 'pkg:cpan/Mojolicious@9.27',
    expected: { type: 'cpan', name: 'Mojolicious', version: '9.27' },
    expectedUrl: 'https://metacpan.org/pod/Mojolicious',
    description: 'CPAN perl module'
  },

  // opam
  {
    input: 'pkg:opam/core@0.15.0',
    expected: { type: 'opam', name: 'core', version: '0.15.0' },
    expectedUrl: 'https://opam.ocaml.org/packages/core/',
    description: 'OPAM OCaml package'
  },

  // swift
  {
    input: 'pkg:swift/apple/swift-nio@2.50.0',
    expected: { type: 'swift', name: 'swift-nio', namespace: 'apple', version: '2.50.0' },
    expectedUrl: 'https://swiftpackageindex.com/apple/swift-nio',
    description: 'swift package'
  },

  // julia
  {
    input: 'pkg:julia/DataFrames@1.5.0',
    expected: { type: 'julia', name: 'DataFrames', version: '1.5.0' },
    expectedUrl: 'https://juliahub.com/ui/Packages/General/DataFrames',
    description: 'julia package'
  },

  // luarocks
  {
    input: 'pkg:luarocks/lunarmodules/luasocket@3.1.0',
    expected: { type: 'luarocks', name: 'luasocket', namespace: 'lunarmodules', version: '3.1.0' },
    expectedUrl: 'https://luarocks.org/modules/lunarmodules/luasocket',
    description: 'luarocks module'
  },

  // bazel
  {
    input: 'pkg:bazel/rules_go@0.39.0',
    expected: { type: 'bazel', name: 'rules_go', version: '0.39.0' },
    expectedUrl: 'https://registry.bazel.build/modules/rules_go',
    description: 'bazel module'
  },

  // conan
  {
    input: 'pkg:conan/boost@1.81.0',
    expected: { type: 'conan', name: 'boost', version: '1.81.0' },
    expectedUrl: 'https://conan.io/center/recipes/boost',
    description: 'conan C++ package'
  },

  // conda
  {
    input: 'pkg:conda/conda-forge/numpy@1.24.0',
    expected: { type: 'conda', name: 'numpy', namespace: 'conda-forge', version: '1.24.0' },
    expectedUrl: 'https://anaconda.org/conda-forge/numpy',
    description: 'conda package'
  },

  // bitnami
  {
    input: 'pkg:bitnami/wordpress@6.1.1',
    expected: { type: 'bitnami', name: 'wordpress', version: '6.1.1' },
    expectedUrl: 'https://bitnami.com/stack/wordpress',
    description: 'bitnami stack'
  },

  // huggingface
  {
    input: 'pkg:huggingface/microsoft/DialoGPT-medium',
    expected: { type: 'huggingface', name: 'DialoGPT-medium', namespace: 'microsoft' },
    expectedUrl: 'https://huggingface.co/microsoft/DialoGPT-medium',
    description: 'huggingface model'
  },

  // vscode-extension
  {
    input: 'pkg:vscode-extension/ms-python/python@2023.1.0',
    expected: { type: 'vscode-extension', name: 'python', namespace: 'ms-python', version: '2023.1.0' },
    expectedUrl: 'https://marketplace.visualstudio.com/items?itemName=ms-python.python',
    description: 'VS Code extension'
  },

  // deb
  {
    input: 'pkg:deb/debian/curl@7.88.1',
    expected: { type: 'deb', name: 'curl', namespace: 'debian', version: '7.88.1' },
    expectedUrl: 'https://packages.debian.org/sid/curl',
    description: 'debian package'
  },

  // rpm
  {
    input: 'pkg:rpm/fedora/httpd@2.4.54',
    expected: { type: 'rpm', name: 'httpd', namespace: 'fedora', version: '2.4.54' },
    expectedUrl: 'https://packages.fedoraproject.org/pkgs/httpd/',
    description: 'RPM package'
  },

  // apk
  {
    input: 'pkg:apk/alpine/openssl@3.0.8',
    expected: { type: 'apk', name: 'openssl', namespace: 'alpine', version: '3.0.8' },
    expectedUrl: 'https://pkgs.alpinelinux.org/packages?name=openssl',
    description: 'alpine package'
  },

  // alpm
  {
    input: 'pkg:alpm/arch/pacman@6.0.2',
    expected: { type: 'alpm', name: 'pacman', namespace: 'arch', version: '6.0.2' },
    expectedUrl: 'https://archlinux.org/packages/?q=pacman',
    description: 'arch linux package'
  },

  // generic
  {
    input: 'pkg:generic/mypackage@1.0.0',
    expected: { type: 'generic', name: 'mypackage', version: '1.0.0' },
    expectedUrl: null,
    description: 'generic package (no registry)'
  },
];

// Invalid PURL test cases
export interface InvalidPurlTestCase {
  input: string;
  expectedErrorCode: string;
  description: string;
}

export const invalidPurlTestCases: InvalidPurlTestCase[] = [
  {
    input: '',
    expectedErrorCode: 'INVALID_FORMAT',
    description: 'empty string'
  },
  {
    input: '   ',
    expectedErrorCode: 'INVALID_FORMAT',
    description: 'whitespace only'
  },
  {
    input: 'npm/lodash',
    expectedErrorCode: 'INVALID_FORMAT',
    description: 'missing pkg: prefix'
  },
  {
    input: 'pkg:',
    expectedErrorCode: 'MISSING_TYPE',
    description: 'missing type'
  },
  {
    input: 'pkg:npm',
    expectedErrorCode: 'MISSING_NAME',
    description: 'missing name'
  },
  {
    input: 'pkg:npm/',
    expectedErrorCode: 'MISSING_NAME',
    description: 'missing name with trailing slash'
  },
  {
    input: 'pkg:unknowntype/package',
    expectedErrorCode: 'UNKNOWN_TYPE',
    description: 'unknown package type'
  },
  {
    input: 'pkg:foobar/something',
    expectedErrorCode: 'UNKNOWN_TYPE',
    description: 'invalid package type'
  },
];

// Edge cases for URL generation
export const edgeCaseTestCases: ValidPurlTestCase[] = [
  // npm scoped package
  {
    input: 'pkg:npm/%40vue/core@3.2.0',
    expected: { type: 'npm', name: 'core', namespace: '@vue', version: '3.2.0' },
    expectedUrl: 'https://www.npmjs.com/package/@vue/core/v/3.2.0',
    description: 'npm scoped with encoded @'
  },
  // Package with qualifiers
  {
    input: 'pkg:deb/debian/curl@7.88.1?distro=bookworm',
    expected: { type: 'deb', name: 'curl', namespace: 'debian', version: '7.88.1', qualifiers: { distro: 'bookworm' } },
    expectedUrl: 'https://packages.debian.org/bookworm/curl',
    description: 'deb with distro qualifier'
  },
  // Package with subpath
  {
    input: 'pkg:github/lodash/lodash@4.17.21#core',
    expected: { type: 'github', name: 'lodash', namespace: 'lodash', version: '4.17.21', subpath: 'core' },
    expectedUrl: 'https://github.com/lodash/lodash',
    description: 'github with subpath'
  },
];

import type { PackageURL, PurlType, RegistryMapping, RegistryResult } from './types/registry-types';

/**
 * Registry mappings for all 38 official PURL types
 */
const registryMappings: Record<PurlType, RegistryMapping> = {
  // Types with central registries
  bazel: { type: 'bazel', registryName: 'Bazel Central Registry', baseUrl: 'https://registry.bazel.build', hasRegistry: true },
  bitbucket: { type: 'bitbucket', registryName: 'Bitbucket', baseUrl: 'https://bitbucket.org', hasRegistry: true },
  bitnami: { type: 'bitnami', registryName: 'Bitnami', baseUrl: 'https://bitnami.com', hasRegistry: true },
  cargo: { type: 'cargo', registryName: 'crates.io', baseUrl: 'https://crates.io', hasRegistry: true },
  cocoapods: { type: 'cocoapods', registryName: 'CocoaPods', baseUrl: 'https://cocoapods.org', hasRegistry: true },
  composer: { type: 'composer', registryName: 'Packagist', baseUrl: 'https://packagist.org', hasRegistry: true },
  conan: { type: 'conan', registryName: 'Conan Center', baseUrl: 'https://conan.io/center', hasRegistry: true },
  conda: { type: 'conda', registryName: 'Anaconda', baseUrl: 'https://anaconda.org', hasRegistry: true },
  cpan: { type: 'cpan', registryName: 'MetaCPAN', baseUrl: 'https://metacpan.org', hasRegistry: true },
  cran: { type: 'cran', registryName: 'CRAN', baseUrl: 'https://cran.r-project.org', hasRegistry: true },
  docker: { type: 'docker', registryName: 'Docker Hub', baseUrl: 'https://hub.docker.com', hasRegistry: true },
  gem: { type: 'gem', registryName: 'RubyGems', baseUrl: 'https://rubygems.org', hasRegistry: true },
  github: { type: 'github', registryName: 'GitHub', baseUrl: 'https://github.com', hasRegistry: true },
  golang: { type: 'golang', registryName: 'Go Packages', baseUrl: 'https://pkg.go.dev', hasRegistry: true },
  hackage: { type: 'hackage', registryName: 'Hackage', baseUrl: 'https://hackage.haskell.org', hasRegistry: true },
  hex: { type: 'hex', registryName: 'Hex.pm', baseUrl: 'https://hex.pm', hasRegistry: true },
  huggingface: { type: 'huggingface', registryName: 'Hugging Face', baseUrl: 'https://huggingface.co', hasRegistry: true },
  julia: { type: 'julia', registryName: 'JuliaHub', baseUrl: 'https://juliahub.com', hasRegistry: true },
  luarocks: { type: 'luarocks', registryName: 'LuaRocks', baseUrl: 'https://luarocks.org', hasRegistry: true },
  maven: { type: 'maven', registryName: 'Maven Central', baseUrl: 'https://central.sonatype.com', hasRegistry: true },
  npm: { type: 'npm', registryName: 'npm', baseUrl: 'https://www.npmjs.com', hasRegistry: true },
  nuget: { type: 'nuget', registryName: 'NuGet', baseUrl: 'https://www.nuget.org', hasRegistry: true },
  opam: { type: 'opam', registryName: 'OPAM', baseUrl: 'https://opam.ocaml.org', hasRegistry: true },
  pub: { type: 'pub', registryName: 'pub.dev', baseUrl: 'https://pub.dev', hasRegistry: true },
  pypi: { type: 'pypi', registryName: 'PyPI', baseUrl: 'https://pypi.org', hasRegistry: true },
  swift: { type: 'swift', registryName: 'Swift Package Index', baseUrl: 'https://swiftpackageindex.com', hasRegistry: true },
  'vscode-extension': { type: 'vscode-extension', registryName: 'VS Marketplace', baseUrl: 'https://marketplace.visualstudio.com', hasRegistry: true },

  // Types requiring qualifiers
  alpm: { type: 'alpm', registryName: 'Arch Linux', baseUrl: null, hasRegistry: true, requiresQualifier: true },
  apk: { type: 'apk', registryName: 'Alpine Linux', baseUrl: null, hasRegistry: true, requiresQualifier: true },
  deb: { type: 'deb', registryName: 'Debian/Ubuntu', baseUrl: null, hasRegistry: true, requiresQualifier: true },
  oci: { type: 'oci', registryName: 'OCI Registry', baseUrl: null, hasRegistry: true, requiresQualifier: true },
  rpm: { type: 'rpm', registryName: 'RPM', baseUrl: null, hasRegistry: true, requiresQualifier: true },
  yocto: { type: 'yocto', registryName: 'Yocto', baseUrl: null, hasRegistry: false, requiresQualifier: true },

  // Types without browsable registry
  generic: { type: 'generic', registryName: 'Generic', baseUrl: null, hasRegistry: false },
  mlflow: { type: 'mlflow', registryName: 'MLflow', baseUrl: null, hasRegistry: false },
  otp: { type: 'otp', registryName: 'Erlang/OTP', baseUrl: null, hasRegistry: false },
  qpkg: { type: 'qpkg', registryName: 'QNX', baseUrl: null, hasRegistry: false },
  swid: { type: 'swid', registryName: 'SWID', baseUrl: null, hasRegistry: false },
};

/**
 * Generate registry URL for a parsed PURL
 */
function generateUrl(purl: PackageURL): string | null {
  const { type, namespace, name, version, qualifiers } = purl;

  switch (type) {
    // npm - handle scoped packages (namespace may include @ prefix)
    case 'npm':
      if (namespace) {
        const scopedName = namespace.startsWith('@') ? `${namespace}/${name}` : `@${namespace}/${name}`;
        return version
          ? `https://www.npmjs.com/package/${scopedName}/v/${version}`
          : `https://www.npmjs.com/package/${scopedName}`;
      }
      return version
        ? `https://www.npmjs.com/package/${name}/v/${version}`
        : `https://www.npmjs.com/package/${name}`;

    // pypi
    case 'pypi':
      return version
        ? `https://pypi.org/project/${name}/${version}/`
        : `https://pypi.org/project/${name}/`;

    // maven - namespace is groupId
    case 'maven':
      if (!namespace) return `https://central.sonatype.com/search?q=${name}`;
      return version
        ? `https://central.sonatype.com/artifact/${namespace}/${name}/${version}`
        : `https://central.sonatype.com/artifact/${namespace}/${name}`;

    // cargo
    case 'cargo':
      return version
        ? `https://crates.io/crates/${name}/${version}`
        : `https://crates.io/crates/${name}`;

    // gem
    case 'gem':
      return version
        ? `https://rubygems.org/gems/${name}/versions/${version}`
        : `https://rubygems.org/gems/${name}`;

    // nuget
    case 'nuget':
      return version
        ? `https://www.nuget.org/packages/${name}/${version}`
        : `https://www.nuget.org/packages/${name}`;

    // golang - namespace contains the module path
    case 'golang':
      const modulePath = namespace ? `${namespace}/${name}` : name;
      return version
        ? `https://pkg.go.dev/${modulePath}@${version}`
        : `https://pkg.go.dev/${modulePath}`;

    // docker - handle official images (library namespace)
    case 'docker':
      if (!namespace || namespace === 'library') {
        return `https://hub.docker.com/_/${name}`;
      }
      return `https://hub.docker.com/r/${namespace}/${name}`;

    // github
    case 'github':
      if (!namespace) return null;
      return `https://github.com/${namespace}/${name}`;

    // bitbucket
    case 'bitbucket':
      if (!namespace) return null;
      return `https://bitbucket.org/${namespace}/${name}`;

    // huggingface
    case 'huggingface':
      if (!namespace) return `https://huggingface.co/models?search=${name}`;
      return `https://huggingface.co/${namespace}/${name}`;

    // hex
    case 'hex':
      return version
        ? `https://hex.pm/packages/${name}/${version}`
        : `https://hex.pm/packages/${name}`;

    // pub
    case 'pub':
      return `https://pub.dev/packages/${name}`;

    // composer - requires namespace
    case 'composer':
      if (!namespace) return `https://packagist.org/?query=${name}`;
      return `https://packagist.org/packages/${namespace}/${name}`;

    // cocoapods
    case 'cocoapods':
      return `https://cocoapods.org/pods/${name}`;

    // hackage
    case 'hackage':
      return `https://hackage.haskell.org/package/${name}`;

    // cran
    case 'cran':
      return `https://cran.r-project.org/package=${name}`;

    // cpan
    case 'cpan':
      if (namespace) {
        return `https://metacpan.org/release/${namespace}/${name}`;
      }
      return `https://metacpan.org/pod/${name}`;

    // opam
    case 'opam':
      return `https://opam.ocaml.org/packages/${name}/`;

    // swift - requires namespace
    case 'swift':
      if (!namespace) return null;
      return `https://swiftpackageindex.com/${namespace}/${name}`;

    // julia - strip .jl suffix if present
    case 'julia':
      const juliaName = name.endsWith('.jl') ? name.slice(0, -3) : name;
      return `https://juliahub.com/ui/Packages/General/${juliaName}`;

    // luarocks - requires namespace
    case 'luarocks':
      if (!namespace) return `https://luarocks.org/search?q=${name}`;
      return `https://luarocks.org/modules/${namespace}/${name}`;

    // bazel
    case 'bazel':
      return `https://registry.bazel.build/modules/${name}`;

    // conan
    case 'conan':
      return `https://conan.io/center/recipes/${name}`;

    // conda - namespace is channel
    case 'conda':
      const channel = namespace || 'anaconda';
      return `https://anaconda.org/${channel}/${name}`;

    // bitnami
    case 'bitnami':
      return `https://bitnami.com/stack/${name}`;

    // vscode-extension - requires namespace (publisher)
    case 'vscode-extension':
      if (!namespace) return null;
      return `https://marketplace.visualstudio.com/items?itemName=${namespace}.${name}`;

    // Types requiring qualifiers - try to build URL from qualifier
    case 'alpm':
      if (qualifiers?.repository_url) return qualifiers.repository_url;
      return `https://archlinux.org/packages/?q=${name}`;

    case 'apk':
      if (qualifiers?.repository_url) return qualifiers.repository_url;
      return `https://pkgs.alpinelinux.org/packages?name=${name}`;

    case 'deb':
      if (qualifiers?.repository_url) return qualifiers.repository_url;
      const distro = qualifiers?.distro || 'sid';
      return `https://packages.debian.org/${distro}/${name}`;

    case 'rpm':
      if (qualifiers?.repository_url) return qualifiers.repository_url;
      return `https://packages.fedoraproject.org/pkgs/${name}/`;

    case 'oci':
      if (qualifiers?.repository_url) return qualifiers.repository_url;
      return null;

    // Types without browsable registry
    case 'generic':
      return qualifiers?.download_url || null;

    case 'mlflow':
    case 'otp':
    case 'qpkg':
    case 'swid':
    case 'yocto':
      return qualifiers?.repository_url || qualifiers?.vcs_url || null;

    default:
      return null;
  }
}

/**
 * Get registry information and URL for a parsed PURL
 */
export function getRegistryUrl(purl: PackageURL): RegistryResult {
  const mapping = registryMappings[purl.type as PurlType];

  if (!mapping) {
    return {
      url: null,
      registryName: 'Unknown',
      hasRegistry: false,
      message: `Unknown package type: ${purl.type}`
    };
  }

  const url = generateUrl(purl);

  if (!mapping.hasRegistry) {
    return {
      url,
      registryName: mapping.registryName,
      hasRegistry: false,
      message: `${mapping.registryName} packages do not have a central browsable registry.`
    };
  }

  if (mapping.requiresQualifier && !url) {
    return {
      url: null,
      registryName: mapping.registryName,
      hasRegistry: true,
      message: `${mapping.registryName} packages require a repository_url or distro qualifier for direct linking.`
    };
  }

  return {
    url,
    registryName: mapping.registryName,
    hasRegistry: true
  };
}

/**
 * Get the registry mapping for a PURL type
 */
export function getRegistryMapping(type: string): RegistryMapping | null {
  return registryMappings[type as PurlType] || null;
}

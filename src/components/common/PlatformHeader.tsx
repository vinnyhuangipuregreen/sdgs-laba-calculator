import header from '../../ui/platform-header.html?raw';

export default function PlatformHeader() {
  return <div className="platform-header-host" dangerouslySetInnerHTML={{__html:header}} />;
}

import { useConnect } from "redux-bundler-hook";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
//import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ProfileMenu() {
  const { authUserInitials, authUsername, doAuthLogout } = useConnect(
    "selectAuthUserInitials",
    "selectAuthUsername",
    "doAuthLogout",
  );
  return (
    <Menu as="div" className="relative ml-3">
      <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        <div className="flex gap-2">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white group-hover:text-gray-50">
                {authUsername}
              </p>
            </div>
          </div>
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-gray-500 outline -outline-offset-1 outline-black/5">
            <span className="font-medium text-white">{authUserInitials}</span>
          </span>
        </div>
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        <MenuItem>
          <a
            href="#"
            className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
          >
            My profile
          </a>
        </MenuItem>
        <MenuItem>
          <span
            onClick={doAuthLogout}
            className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
          >
            Sign out
          </span>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

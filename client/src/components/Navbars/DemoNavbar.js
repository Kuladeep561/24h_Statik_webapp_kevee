import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Headroom from "headroom.js";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import {
  Button,
  UncontrolledCollapse,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  UncontrolledDropdown,
  NavbarBrand,
  Navbar,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
  UncontrolledTooltip,
} from "reactstrap";

const DemoNavbar = () => {
  const [collapseClasses, setCollapseClasses] = useState("");
  const signOut = useSignOut();
  const isAuthenticated = useIsAuthenticated();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let headroom = new Headroom(document.getElementById("navbar-main"));
    headroom.init();

    const email = localStorage.getItem("email");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const onExiting = () => {
    setCollapseClasses("collapsing-out");
  };

  const onExited = () => {
    setCollapseClasses("");
  };

  return (
    <>
      <header className="header-global">
        <Navbar className="navbar-main navbar-transparent navbar-light headroom" expand="lg" id="navbar-main">
          <Container>
            <NavbarBrand className="mr-lg-5" to="/" tag={Link}>
              <img alt="..." src={require("assets/img/brand/24h-logo.png")} />
            </NavbarBrand>
            <button className="navbar-toggler" id="navbar_global">
              <span className="navbar-toggler-icon" />
            </button>
            <UncontrolledCollapse
              toggler="#navbar_global"
              navbar
              className={collapseClasses}
              onExiting={onExiting}
              onExited={onExited}
            >
              <div className="navbar-collapse-header">
                <Row>
                  <Col className="collapse-brand" xs="6">
                    <Link to="/">
                      <img alt="..." src={require("assets/img/brand/24h-logo.png")} />
                    </Link>
                  </Col>
                  <Col className="collapse-close" xs="6">
                    <button className="navbar-toggler" id="navbar_global">
                      <span />
                      <span />
                    </button>
                  </Col>
                </Row>
              </div>
              <Nav className="navbar-nav-hover align-items-lg-center" navbar>
                <UncontrolledDropdown nav>
                  <DropdownToggle nav>
                    <i className="ni ni-collection d-lg-none mr-1" />
                    <span className="nav-link-inner--text">Services</span>
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem tag={Link} to="/wo-page">
                      Wall Openings
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Nav>
              <Nav className="align-items-lg-center ml-lg-auto" navbar>
                <NavItem>
                  <NavLink
                    className="nav-link-icon"
                    href="https://www.instagram.com/kevee_visioneers/"
                    id="tooltip356693867"
                    target="_blank"
                  >
                    <i className="fa fa-instagram" />
                    <span className="nav-link-inner--text d-lg-none ml-2">Instagram</span>
                  </NavLink>
                  <UncontrolledTooltip delay={0} target="tooltip356693867">
                    Follow us on Instagram
                  </UncontrolledTooltip>
                </NavItem>
                <NavItem>
                  <NavLink className="nav-link-icon" href="https://github.com/Kuladeep561" id="tooltip112445449" target="_blank">
                    <i className="fa fa-github" />
                    <span className="nav-link-inner--text d-lg-none ml-2">Github</span>
                  </NavLink>
                  <UncontrolledTooltip delay={0} target="tooltip112445449">
                    Star us on Github
                  </UncontrolledTooltip>
                </NavItem>
                <NavItem>
                  <NavLink className="nav-link-icon" href="https://www.kevee.com/" id="tooltip112445450" target="_blank">
                    <i className="fa fa-globe" />
                    <span className="nav-link-inner--text d-lg-none ml-2">Web</span>
                  </NavLink>
                  <UncontrolledTooltip delay={0} target="tooltip112445450">
                    Know us
                  </UncontrolledTooltip>
                </NavItem>
                <NavItem className="d-none d-lg-block ml-lg-4">
                  {isAuthenticated ? (
                    <Button
                      className="btn-neutral btn-icon"
                      size="sm"
                      color="default"
                      onClick={() => {
                        signOut();
                        localStorage.removeItem("tokenExpiration");
                        localStorage.removeItem("email");
                        window.location.href = "/login-page";
                      }}
                      tag={Link}
                    >
                      <span className="btn-inner--icon">
                        <i className="fa fa-sign-out mr-2" />
                      </span>
                      <span className="nav-link-inner--text ml-1">Logout</span>
                    </Button>
                  ) : (
                    <Button className="btn-neutral btn-icon" size="sm" color="default" to="/login-page" tag={Link}>
                      <span className="btn-inner--icon">
                        <i className="fa fa-sign-in mr-2" />
                      </span>
                      <span className="nav-link-inner--text ml-1">Login</span>
                    </Button>
                  )}
                </NavItem>
                <NavItem>
                  <NavLink className="nav-link-icon" id="tooltip112445405">
                    <i className="fa fa-user fa-2x" />
                    <span className="nav-link-inner--text d-lg-none ml-2">Web</span>
                  </NavLink>
                  <UncontrolledTooltip delay={0} target="tooltip112445405">
                    {userEmail ? userEmail : "User Profile"}
                  </UncontrolledTooltip>
                </NavItem>
              </Nav>
            </UncontrolledCollapse>
          </Container>
        </Navbar>
      </header>
    </>
  );
};

export default DemoNavbar;

#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "Installation should be run as root. Are you root?"
  exit
fi

apt update
apt install python-pip nginx php php-curl php-json php-ldap php-mysqli php-xml mysql-server make gcc libssl-dev lib32z1 build-essential gcc uuid uuid-dev perl libssl-dev perl-doc liburi-perl libxml-libxml-perl libcrypt-ssleay-perl -y
cpan install CPAN
cpan reload cpan
cpan install JSON
cpan install YAML
cpan install LWP::Protocol::https
cpan install IO::Socket::SSL
cpan install Switch
cpan install Socket6
pip install --upgrade pip
pip install python-openstackclient


mkdir -p /var/log/selfportal
chmod 750 /var/log/selfportal

cat >/etc/logrotate.d/selfportal <<EOL
/var/log/selfportal/*log {
        weekly
        missingok
        rotate 12
        compress
        delaycompress
        notifempty
        create 0600 www-data www-data
}
EOL

mkdir -p /var/www/selfportal
cp * /var/www/selfportal -R

rm -f /var/www/selfportal/config/config.php
touch /var/www/selfportal/config/config.php
chmod 755 /var/www/selfportal/config/config.php
cat >>/var/www/selfportal/config/config.php <<EOL
<?php
//Config logs
define('LOG_FILE',"/var/log/selfportal/selfportal.log");
EOL

echo "Please, provide me with a credentials for your mysql database (root/empty by default)."
while [[ -z $mysqlname ]]
do
  read -p "Enter username: " mysqlname
done
read -s -p "Enter password: " mysqlpasswd

if [ -z "$mysqlpasswd" ]
then
	mysql -uroot <<MYSQL_SCRIPT
	CREATE DATABASE portal;
MYSQL_SCRIPT
	mysql portal -u $mysqlname < /var/www/selfportal/db/portal.sql
else
	mysql -u$mysqlname -p$mysqlpasswd  <<MYSQL_SCRIPT
	CREATE DATABASE portal;
MYSQL_SCRIPT
	mysql portal -u$mysqlname -p$mysqlpasswd < /var/www/selfportal/db/portal.sql
fi

cat >>/var/www/selfportal/config/config.php <<EOL
//Config DB
define ('DB_USER', "$mysqlname");
define ('DB_PASSWORD', "$mysqlpasswd");
define ('DB_DATABASE', "portal");
define ('DB_HOST', "localhost");
EOL

echo "Now you can connect to SelfPortal using LDAP Auth only. So we need to configure it now: "

while [[ -z "$ldapserver" ]]
do
	read -p "Enter LDAP server name (like controller.example.com): " ldapserver
done
while [[ -z "$ldapdn" ]]
do
	read -p "Enter full DN of users OU (like OU=Users,DC=example,DC=com): " ldapdn
done
while [[ -z "$ldapdnadmin" ]]
do
	read -p "Enter full DN of administratros OU (like OU=Admins,DC=example,DC=com): " ldapdnadmin
done
while [[ -z "$ldapug" ]]
do
	read -p "Enter user group (people in that group in users OU will be able to use SelfPortal): " ldapug
done
while [[ -z "$ldapags" ]]
do
	read -p "Enter administrators group (people in that group in admin OU will be able to configure SelfPortal). WARNING: Format for this entry only should be like \"Admin1\",\"Admin2\" - group names in double quotes, separated by comma: " ldapags
done
while [[ -z "$ldapusrdom" ]]
do
	read -p "Enter domain name (like @example.corp, @example.com): " ldapusrdom
done
cat >>/var/www/selfportal/config/config.php <<EOL
//Config LDAP
define('LDAP_HOST', "$ldapserver");
define('LDAP_DN_Users',"$ldapdn");
define('LDAP_DN_Admins',"$ldapdnadmin");
define('LDAP_USER_GROUP', "$ldapug");
define('LDAP_MANAGER_GROUPS', serialize (array ($ldapags)));
define('LDAP_USR_DOM',"$ldapusrdom");
EOL


echo "SelfPortal is all about notifications. Let's setup mail notifications for users and administrators:"
while [[ -z "$mail" ]]
do
	read -p "Enter login of notification user. It will send notifications to users and administrators (like notify@example.com): " mail
done
while [[ -z "$mpasswd" ]]
do
	read -s -p "Enter password: " mpasswd
done
echo
while [[ -z "$mserver" ]]
do
	read -p "Enter your mail server: " mserver
done
while [[ -z "$madmin" ]]
do
	read -p "Enter mailbox of helpdesk team (like helpdesk@example.com): " madmin
done

cat >>/var/www/selfportal/config/config.php <<EOL
//Config MAIL
define('MAIL_USER',"$mail");
define('MAIL_PASS',"$mpasswd");
define('MAIL_SERVER',"$mserver");
define('MAIL_ADMIN',"$madmin");
EOL

read -p "Do you want to configure SelfPortal to work with OpenStack? [Yy/Nn]" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo
	echo "Well then. Now we will need you to provide us with some information about your installation:"

	while [[ -z "$openstackserver" ]]
	do
		read -p "Enter OpenStack endpoint (like https://openstack.example.com:5000/v3): " openstackserver
	done
    cat >>/var/www/selfportal/config/config.php <<EOL
//Config OpenStack
define('OS_AUTH_URL',"$openstackserver");
EOL

	while [[ -z "$openstackprojectid" ]]
	do
		read -p "Enter OpenStack project id: " openstackprojectid
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_PROJECT_ID',"$openstackprojectid");
EOL

	while [[ -z "$openstackprojectname" ]]
	do
		read -p "Enter OpenStack project name: " openstackprojectname
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_PROJECT_NAME',"$openstackprojectname");
EOL

	while [[ -z "$openstackuserdomain" ]]
	do
		read -p "Enter OpenStack user domain name (like Default): " openstackuserdomain
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_USER_DOMAIN_NAME',"$openstackuserdomain");
EOL

	while [[ -z "$openstackuser" ]]
	do
		read -p "Enter OpenStack username we can use to deploy VMs: " openstackuser
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_USERNAME',"$openstackuser");
EOL

	while [[ -z "$openstackpassword" ]]
	do
		read -s -p "Enter password: " openstackpassword
		echo
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_PASSWORD',"$openstackpassword");
EOL

	while [[ -z "$openstackregion" ]]
	do
		read -p "Enter OpenStack region name (like RegionOne): " openstackregion
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_REGION_NAME',"$openstackregion");
EOL

	while [[ -z "$openstackinterface" ]]
	do
		read -p "Enter interface (like public): " openstackinterface
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_INTERFACE',"$openstackinterface");
EOL

	while [[ -z "$openstackidentity" ]]
	do
		read -p "Enter OpenStack identity ip version (like 3): " openstackidentity
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_IDENTITY_API_VERSION',"$openstackidentity");
EOL

	while [[ -z "$openstacknetworkid" ]]
	do
		read -p "Enter OpenStack network id: " openstacknetworkid
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_NET_ID',"$openstacknetworkid");
EOL

	while [[ -z "$openstacksecuritygroup" ]]
	do
		read -p "Enter OpenStack security group: " openstacksecuritygroup
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
define('OS_SEC_GRP',"$openstacksecuritygroup");
EOL

	echo "Great, we've done with OpenStack configuration!";
else echo "Okay, it doesn't seems to be Y or y symbol, so no connections to OpenStack were made."
fi



read -p "Do you want to configure SelfPortal to work with vSphere? [Yy/Nn]" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo
	while [[ -z "$vcenter" ]]
	do
		read -p "Enter VMWare vCenter server address (like https://vcenter.example.com): " vcenter
	done
	while [[ -z "$vcenteruser" ]]
	do
		read -p "Okay. Now we need to login. Enter VMWare vCenter user: " vcenteruser
	done
	while [[ -z "$vcenterpasswd" ]]
	do
		read -s -p "Enter password: " vcenterpasswd
	done
	while [[ -z "$vcentertemplatefolder" ]]
	do
		read -p "SelfPortal VMs based on VM templates. Where should SP search for this templates? Please, enter search folder: " vcentertemplatefolder
	done
	while [[ -z "$vcentervmsfolder" ]]
	do
		read -p "SelfPortal need a place, where it will put created VMs. Where is it? Please, enter folder name: " vcentervmsfolder
	done
	while [[ -z "$vcenterrp" ]]
	do
		read -p "And a resource pool too: " vcenterrp
	done
	while [[ -z "$vcenterds" ]]
	do
		read -p "Which datastore SP VMs should use? Enter: " vcenterds
	done
	while [[ -z "$vcenterdc" ]]
	do
		read -p "In which datacenter SP should search for VMs? Enter: " vcenterdc
	done
    cat >>/var/www/selfportal/config/config.php <<EOL
//vSphere CONFIG
define('VMW_USERNAME',"$vcenteruser");
define('VMW_PASSWORD',"$vcenterpasswd");
define('VMW_SERVER',"$vcenter");
define('VMW_TEMPLATE_FOLDER',"$vcentertemplatefolder");
define('VMW_VM_FOLDER',"$vcentervmsfolder");
define('VMW_RESOURCE_POOL',"$vcenterrp");
define('VMW_DATASTORE',"$vcenterds");
define('VMW_DATACENTER',"$vcenterdc");
EOL

	echo "Great, we've done with vSphere configuration!";
else echo
	echo "Okay, it doesn't seems to be Y or y symbol, so no connections to vSphere config were made."
fi

while [[ -z "$servername" ]]
do
  read -p "Enter full address of your future SelfPortal installation (like selfportal.altoros.com). For default use \"_\" symbol: " servername
done

cp /var/www/selfportal/config/sites-enabled/proxy.conf /etc/nginx/sites-enabled/proxy.conf
cat >/etc/nginx/sites-enabled/selfportal <<EOL
server {
        listen 80 default_server;

        root /var/www/selfportal/;
        index index.html index.htm index.php ;

        server_name $servername;

		location / {
			# First attempt to serve request as file, then
			# as directory, then fall back to displaying a 404.
			try_files $uri $uri/ =404;
		}

		location ~ \.php$ {
			include snippets/fastcgi-php.conf;

	#		# With php7.0-cgi alone:
	#		fastcgi_pass 127.0.0.1:9000;
	#		# With php7.0-fpm:
			fastcgi_pass unix:/run/php/php7.0-fpm.sock;
		}

	# deny access to .htaccess files, if Apache's document root
	# concurs with nginx's one
	#
	location ~ /\.ht {
		deny all;
	}

}
EOL
cat >>/var/www/selfportal/config/config.php <<EOL
//NGINX CONFIG
define('NGINX_FILE',"/etc/nginx/sites-enabled/proxy.conf");
EOL

echo 'www-data ALL=NOPASSWD: /usr/sbin/nginx, /usr/bin/crontab, /bin/grep' >> /etc/sudoers

read -p "Now we can configure scheduled VM cleaning. Would you like us to add appropriate jobs to crontab? [Yy/Nn] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    (crontab -l 2>/dev/null; echo "0 8 */1 * * /usr/bin/php /var/www/selfportal/modules/tasks.php --action notify" ) | crontab -
	(crontab -l 2>/dev/null; echo "1 0 */1 * * /usr/bin/php /var/www/selfportal/modules/tasks.php --action disable" ) | crontab -
	(crontab -l 2>/dev/null; echo "5 0 */1 * * /usr/bin/php /var/www/selfportal/modules/tasks.php --action delete" ) | crontab -
	(crontab -l 2>/dev/null; echo "10 0 */1 * * /usr/bin/php /var/www/selfportal/modules/tasks.php --action shutdown_vm" ) | crontab -
	(crontab -l 2>/dev/null; echo "15 0 */1 * * /usr/bin/php /var/www/selfportal/modules/tasks.php --action terminate_vm" ) | crontab -
	while [[ -z "$daysbeforeshutdown" ]]
	do
  		read -p "When user must start receiving notifications about the automatic VM shutdown (like 5 days before expiration date). Enter number in days only: " daysbeforeshutdown
	done
	while [[ -z "$daysbeforedelete" ]]
	do
  		read -p "After how many days after expiration day about the automatic VM shutdown (like 5 days before expiration date). Enter number in days only: " daysbeforedelete

	done
	while [[ -z "$extlimit" ]]
	do
  		read -p "User can set lifetime of their VMs. VMs should life not londer than ? days? Enter number only: " extlimit
	done
	cat >>/var/www/selfportal/config/config.php <<EOL
//TASKS CONFIG
define('DAYS_BEFORE_DISABLE',"$daysbeforeshutdown");
define('DAYS_BEFORE_DELETE',"-$daysbeforedelete");
define('DAYS_USER_CAN_EXTEND_VM',"$extlimit");
EOL
else
	echo "Okay, it doesn't seems to be Y or y symbol, so no actions will be done."
fi

echo "Please, do not forget to install Perl SDK according to your vSphere version (for 6.0 it is https://code.vmware.com/web/sdk/60/vsphere-perl)"

	cat >>/var/www/selfportal/config/config.php <<EOL
?>
EOL
